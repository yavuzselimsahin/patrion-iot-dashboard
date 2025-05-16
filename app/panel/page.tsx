'use client';
import { Card, Row, Col, Typography } from 'antd';
import { UserOutlined, FileTextOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title } = Typography;

export default function PanelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Title level={2} className="text-center mb-8">Admin Panel</Title>
      
      <Row gutter={[24, 24]} justify="center">
        <Col xs={24} sm={12} md={10} lg={8}>
          <Card 
            hoverable
            className="h-64 flex flex-col justify-center items-center shadow-lg"
            onClick={() => router.push('/panel/user-management')}
          >
            <UserOutlined className="text-5xl mb-4 text-blue-500" />
            <Title level={3}>User Management</Title>
            <p className="text-gray-500 text-center">Manage all users and permissions</p>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={10} lg={8}>
          <Card 
            hoverable
            className="h-64 flex flex-col justify-center items-center shadow-lg"
            onClick={() => router.push('/panel/logs')}
          >
            <FileTextOutlined className="text-5xl mb-4 text-green-500" />
            <Title level={3}>System Logs</Title>
            <p className="text-gray-500 text-center">View and analyze system logs</p>
          </Card>
        </Col>
      </Row>
    </div>
  );
}