'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Button, Modal, Form, Input, Select, message, Popconfirm, Tag, Space, Card } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';

const { Option } = Select;

interface User {
  id: string;
  email: string;
  role: {
    name: string;
  };
  company?: {
    name: string;
  };
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const router = useRouter();

  // Kullanıcıları getirme
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch( process.env.NEXT_PUBLIC_URL + '/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      message.error('Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Kullanıcı oluşturma/güncelleme
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const token = localStorage.getItem('token');
      
      const url = editingUserId 
        ? `${process.env.NEXT_PUBLIC_URL}/users/${editingUserId}`
        :  process.env.NEXT_PUBLIC_URL + '/users';
      
      const method = editingUserId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(values)
      });
      
      if (!response.ok) throw new Error(editingUserId ? 'Update failed' : 'Creation failed');
      
      message.success(editingUserId ? 'User updated successfully' : 'User created successfully');
      setIsModalVisible(false);
      form.resetFields();
      fetchUsers();
    } catch (error) {
      message.error('Operation failed');
    }
  };

  // Kullanıcı silme
  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Deletion failed');
      
      message.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      message.error('Failed to delete user');
    }
  };

  // Düzenleme modunu açma
  const handleEdit = (user: User) => {
    setEditingUserId(user.id);
    form.setFieldsValue({
      email: user.email,
      role: user.role.name
    });
    setIsModalVisible(true);
  };

  const columns = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (text: string) => (
        <span>
          <MailOutlined style={{ marginRight: 8 }} />
          {text}
        </span>
      ),
    },
    {
      title: 'Role',
      dataIndex: ['role', 'name'],
      key: 'role',
      render: (role: string) => (
        <Tag color={role === 'SystemAdmin' ? 'red' : role === 'CompanyAdmin' ? 'orange' : 'green'}>
          {role}
        </Tag>
      ),
    },
    {
      title: 'Company',
      dataIndex: ['company', 'name'],
      key: 'company',
      render: (company: string) => company || 'N/A',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: User) => (
        <Space size="middle">
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Are you sure to delete this user?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
    <div className="p-6">
      <Card
        title="User Management"
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingUserId(null);
              form.resetFields();
              setIsModalVisible(true);
            }}
          >
            Add User
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingUserId ? 'Edit User' : 'Create User'}
        visible={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please input email!' },
              { type: 'email', message: 'Invalid email format' }
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email" />
          </Form.Item>

          {!editingUserId && (
            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please input password!' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Password" />
            </Form.Item>
          )}

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Please select role!' }]}
          >
            <Select placeholder="Select a role">
              <Option value="SystemAdmin">System Admin</Option>
              <Option value="CompanyAdmin">Company Admin</Option>
              <Option value="User">Regular User</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
    </div>
  );
}