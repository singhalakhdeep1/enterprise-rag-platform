import React, { useState, useEffect } from 'react';

interface DashboardStats {
  totalDocuments: number;
  totalQueries: number;
  activeUsers: number;
  avgResponseTime: number;
  storageUsed: number;
  storageLimit: number;
}

interface RecentActivity {
  id: string;
  type: 'upload' | 'query' | 'export' | 'delete';
  user: string;
  description: string;
  timestamp: Date;
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  cpu: number;
  memory: number;
  disk: number;
}

interface AdminDashboardProps {
  userId: string;
}

export function AdminDashboard({ userId }: AdminDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [userId]);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, activityRes, healthRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/activity'),
        fetch('/api/admin/health'),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (activityRes.ok) setActivities(await activityRes.json());
      if (healthRes.ok) setSystemHealth(await healthRes.json());
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthColor = (status: string) => {
    const colors: Record<string, string> = {
      healthy: 'bg-green-500',
      degraded: 'bg-yellow-500',
      down: 'bg-red-500',
    };
    return colors[status] || colors.down;
  };

  const getActivityIcon = (type: string) => {
    const icons: Record<string, string> = {
      upload: '📤',
      query: '🔍',
      export: '📥',
      delete: '🗑️',
    };
    return icons[type] || '📌';
  };

  if (isLoading) return <div>Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Admin Dashboard</h2>

      {/* System Health */}
      {systemHealth && (
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-3 h-3 rounded-full ${getHealthColor(systemHealth.status)}`} />
            <span className="font-semibold capitalize">{systemHealth.status}</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">CPU</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${systemHealth.cpu}%` }}
                  />
                </div>
                <span className="text-sm">{systemHealth.cpu}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Memory</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${systemHealth.memory}%` }}
                  />
                </div>
                <span className="text-sm">{systemHealth.memory}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Disk</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full"
                    style={{ width: `${systemHealth.disk}%` }}
                  />
                </div>
                <span className="text-sm">{systemHealth.disk}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Documents</p>
            <p className="text-2xl font-bold">{stats.totalDocuments.toLocaleString()}</p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Queries</p>
            <p className="text-2xl font-bold">{stats.totalQueries.toLocaleString()}</p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-600">Active Users</p>
            <p className="text-2xl font-bold">{stats.activeUsers}</p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-600">Avg Response Time</p>
            <p className="text-2xl font-bold">{stats.avgResponseTime.toFixed(0)}ms</p>
          </div>
        </div>
      )}

      {/* Storage */}
      {stats && (
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Storage Usage</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-gray-200 rounded-full h-4">
              <div
                className="bg-blue-500 h-4 rounded-full"
                style={{ width: `${(stats.storageUsed / stats.storageLimit) * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium">
              {(stats.storageUsed / 1024 / 1024 / 1024).toFixed(2)} / {(stats.storageLimit / 1024 / 1024 / 1024).toFixed(2)} TB
            </span>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-3">Recent Activity</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
              <span className="text-xl">{getActivityIcon(activity.type)}</span>
              <div className="flex-1">
                <p className="text-sm">{activity.description}</p>
                <p className="text-xs text-gray-600">{activity.user}</p>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(activity.timestamp).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-3">Quick Actions</h3>
        <div className="grid grid-cols-3 gap-3">
          <button className="px-4 py-2 bg-blue-500 text-white rounded text-sm">
            Rebuild Index
          </button>
          <button className="px-4 py-2 bg-gray-200 rounded text-sm">
            Clear Cache
          </button>
          <button className="px-4 py-2 bg-gray-200 rounded text-sm">
            Export Logs
          </button>
          <button className="px-4 py-2 bg-gray-200 rounded text-sm">
            Manage Users
          </button>
          <button className="px-4 py-2 bg-gray-200 rounded text-sm">
            System Config
          </button>
          <button className="px-4 py-2 bg-red-500 text-white rounded text-sm">
            Emergency Stop
          </button>
        </div>
      </div>
    </div>
  );
}
