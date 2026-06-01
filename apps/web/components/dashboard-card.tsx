type DashboardCardProps = {
    title: string;
    subtitle: string;
    children: React.ReactNode;
};

export function DashboardCard({ title, subtitle, children }: DashboardCardProps) {
    return (
        <section className="card">
            <p className="label">{subtitle}</p>
            <h2>{title}</h2>
            {children}
        </section>
    );
}
