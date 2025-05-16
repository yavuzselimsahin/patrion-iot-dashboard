'use client';
import { useState, useEffect } from 'react';
import { Table, Tag, Card, Input, Button, Select, DatePicker, Space, Typography } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';

const { RangePicker } = DatePicker;
const { Text } = Typography;

interface Log {
  id: number;
  action: string;
  userEmail: string;
  userId: number;
  metadata: Record<string, any>;
  createdAt: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [filters, setFilters] = useState({
    userId: undefined as number | undefined,
    action: undefined as string | undefined,
    dateRange: undefined as [string, string] | undefined
  });
  const router = useRouter();

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = process.env.NEXT_PUBLIC_URL + '/logs?';
      
      if (filters.userId) url += `userId=${filters.userId}&`;
      if (filters.action) url += `action=${filters.action}&`;
      if (filters.dateRange) {
        url += `startDate=${filters.dateRange[0]}&endDate=${filters.dateRange[1]}&`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch logs');
      
      const data = await response.json();
      setLogs(data);
      
      // Log visit kaydı
      await fetch( process.env.NEXT_PUBLIC_URL + '/logs/view', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const handleResetFilters = () => {
    setFilters({
      userId: undefined,
      action: undefined,
      dateRange: undefined
    });
  };

  const columns: ColumnType<Log>[] = [
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => (
        <Tag color={getActionColor(action)}>
          {action.toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'Viewed Logs', value: 'viewed_logs' },
        { text: 'Login', value: 'login' },
        { text: 'Logout', value: 'logout' },
        { text: 'User Created', value: 'user_created' },
        { text: 'User Updated', value: 'user_updated' },
        { text: 'User Deleted', value: 'user_deleted' },
      ],
      onFilter: (value, record) => record.action === value,
    },
    {
      title: 'User',
      dataIndex: 'userEmail',
      key: 'userEmail',
      render: (email: string, record: Log) => (
        <div>
          <Text strong>{email}</Text>
          <br />
          <Text type="secondary">ID: {record.userId}</Text>
        </div>
      ),
    },
    {
      title: 'Metadata',
      dataIndex: 'metadata',
      key: 'metadata',
      render: (metadata: Record<string, any> = {}) => (
        <div>
          {Object.entries(metadata).map(([key, value]) => (
            <div key={key}>
              <Text type="secondary">{key}: </Text>
              <Text>{JSON.stringify(value)}</Text>
            </div>
          ))}
          {Object.keys(metadata).length === 0 && <Text type="secondary">No metadata</Text>}
        </div>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
  ];

  const getActionColor = (action: string) => {
    switch (action) {
      case 'login': return 'green';
      case 'logout': return 'volcano';
      case 'user_created': return 'cyan';
      case 'user_updated': return 'blue';
      case 'user_deleted': return 'red';
      case 'viewed_logs': return 'purple';
      default: return 'geekblue';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
    <div className="p-6">
      <Card
        title="System Logs"
        extra={
          <Button 
            icon={<ReloadOutlined />} 
            onClick={fetchLogs}
            loading={loading}
          >
            Refresh
          </Button>
        }
      >
        <div className="mb-4">
          <Space size="middle">
            <Input
              placeholder="User ID"
              type="number"
              value={filters.userId}
              onChange={(e) => setFilters({...filters, userId: e.target.value ? Number(e.target.value) : undefined})}
              style={{ width: 120 }}
            />
            
            <Select
              placeholder="Action Type"
              style={{ width: 180 }}
              allowClear
              value={filters.action}
              onChange={(value) => setFilters({...filters, action: value})}
            >
              <Select.Option value="viewed_logs">Viewed Logs</Select.Option>
              <Select.Option value="login">Login</Select.Option>
              <Select.Option value="logout">Logout</Select.Option>
              <Select.Option value="user_created">User Created</Select.Option>
              <Select.Option value="user_updated">User Updated</Select.Option>
              <Select.Option value="user_deleted">User Deleted</Select.Option>
            </Select>
            
            <RangePicker
              showTime
              onChange={(dates) => {
                if (dates) {
                  setFilters({
                    ...filters,
                    dateRange: [
                      dates[0]?.toISOString() || '',
                      dates[1]?.toISOString() || ''
                    ]
                  });
                } else {
                  setFilters({...filters, dateRange: undefined});
                }
              }}
            />
            
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={fetchLogs}
              loading={loading}
            >
              Search
            </Button>
            
            <Button onClick={handleResetFilters}>
              Reset
            </Button>
          </Space>
        </div>
        
        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 8
          }}
          scroll={{ x: true }}
        />
      </Card>
    </div>
    </div>
  );
}