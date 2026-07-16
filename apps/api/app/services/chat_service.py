from typing import Optional, AsyncGenerator
from app.core.database import get_db
from app.services.rag_service import RAGService
from app.models.conversation import Conversation, Message


class ChatService:
    def __init__(self):
        self.rag_service = RAGService()
    
    async def process_message(
        self,
        tenant_id: str,
        message: str,
        conversation_id: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> dict:
        """Process a chat message and generate a response"""
        
        # Get or create conversation
        if conversation_id:
            conversation = await self.get_conversation(conversation_id)
        else:
            conversation = await self.create_conversation(tenant_id, user_id)
        
        # Store user message
        await self.store_message(
            conversation_id=conversation.id,
            role="user",
            content=message
        )
        
        # Get conversation history for context
        history = await self.get_conversation_history(conversation.id)
        
        # Generate response using RAG
        response = await self.rag_service.generate_response(
            tenant_id=tenant_id,
            query=message,
            conversation_history=history
        )
        
        # Store assistant message
        await self.store_message(
            conversation_id=conversation.id,
            role="assistant",
            content=response["answer"],
            sources=response.get("sources", [])
        )
        
        return {
            "conversation_id": conversation.id,
            "answer": response["answer"],
            "sources": response.get("sources", []),
            "follow_up_questions": response.get("follow_up_questions", [])
        }
    
    async def generate_streaming_response(
        self,
        tenant_id: str,
        query: str,
        conversation_id: str
    ) -> AsyncGenerator[str, None]:
        """Generate streaming response for real-time chat"""
        
        history = await self.get_conversation_history(conversation_id)
        
        async for chunk in self.rag_service.generate_streaming_response(
            tenant_id=tenant_id,
            query=query,
            conversation_history=history
        ):
            yield chunk
    
    async def create_conversation(
        self,
        tenant_id: str,
        user_id: Optional[str] = None
    ) -> Conversation:
        """Create a new conversation"""
        async with get_db() as db:
            conversation = Conversation(
                tenant_id=tenant_id,
                user_id=user_id,
                title="New Conversation"
            )
            db.add(conversation)
            await db.commit()
            await db.refresh(conversation)
            return conversation
    
    async def get_conversation(self, conversation_id: str) -> Conversation:
        """Get conversation by ID"""
        async with get_db() as db:
            result = await db.execute(
                select(Conversation).where(Conversation.id == conversation_id)
            )
            return result.scalar_one()
    
    async def store_message(
        self,
        conversation_id: str,
        role: str,
        content: str,
        sources: Optional[list] = None
    ) -> Message:
        """Store a message in the conversation"""
        async with get_db() as db:
            message = Message(
                conversation_id=conversation_id,
                role=role,
                content=content,
                sources=sources or []
            )
            db.add(message)
            await db.commit()
            await db.refresh(message)
            return message
    
    async def get_conversation_history(
        self,
        conversation_id: str,
        limit: int = 10
    ) -> list[dict]:
        """Get conversation history"""
        async with get_db() as db:
            result = await db.execute(
                select(Message)
                .where(Message.conversation_id == conversation_id)
                .order_by(Message.created_at.desc())
                .limit(limit)
            )
            messages = result.scalars().all()
            
            return [
                {"role": msg.role, "content": msg.content}
                for msg in reversed(messages)
            ]
    
    async def summarize_conversation(self, conversation_id: str) -> str:
        """Summarize the conversation"""
        history = await self.get_conversation_history(conversation_id, limit=50)
        
        # Use NLP service to summarize
        from app.services.nlp_service import NLPService
        nlp_service = NLPService()
        
        full_text = "\n".join([f"{msg['role']}: {msg['content']}" for msg in history])
        summary = nlp_service.summarize_text(full_text)
        
        return summary
