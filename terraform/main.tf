# Terraform configuration for enterprise-rag-platform AWS infrastructure

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

resource "aws_vpc" "rag_platform" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "rag-platform-vpc"
  }
}

resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.rag_platform.id
  cidr_block              = "10.0.${count.index}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "rag-platform-public-${count.index}"
  }
}

resource "aws_eks_cluster" "rag_platform" {
  name     = "rag-platform-eks"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = "1.28"

  vpc_config {
    subnet_ids = aws_subnet.public[*].id
  }
}

resource "aws_eks_node_group" "rag_platform" {
  cluster_name    = aws_eks_cluster.rag_platform.name
  node_group_name = "rag-nodes"
  node_role_arn   = aws_iam_role.eks_nodes.arn
  subnet_ids      = aws_subnet.public[*].id

  scaling_config {
    desired_size = 3
    max_size     = 6
    min_size     = 2
  }

  instance_types = ["t3.large"]
}

resource "aws_elasticache_cluster" "rag_redis" {
  cluster_id           = "rag-redis"
  engine               = "redis"
  node_type            = "cache.t3.medium"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
}

resource "aws_elasticsearch_domain" "rag_search" {
  domain_name    = "rag-search"
  engine_type    = "OpenSearch"
  engine_version = "2.5"

  cluster_config {
    instance_type          = "t3.medium.search"
    instance_count         = 2
    dedicated_master_count = 0
  }

  ebs_options {
    ebs_enabled = true
    volume_size = 20
  }

  access_policies = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "es:*",
      "Resource": "*"
    }
  ]
}
POLICY
}

data "aws_availability_zones" "available" {
  state = "available"
}
