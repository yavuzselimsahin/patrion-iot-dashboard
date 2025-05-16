'use client';
import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { Modal, Button, Input, message, Card, Table, Tag, Dropdown, MenuProps } from 'antd';
import { 
  LockOutlined, 
  MailOutlined, 
  DashboardOutlined, 
  LogoutOutlined,
  UserOutlined,
  SettingOutlined,
  DownOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';

interface SensorData {
  sensor_id: string;
  timestamp: number;
  temperature: number;
  humidity: number;
}

interface LoginData {
  email: string;
  password: string;
}

interface User {
  id: number;
  email: string;
  name?: string;
  role: {
    id: number;
    name: string;
  };
  company?: {
    id: number;
    name: string;
  };
}

export default function Home() {
  const router = useRouter();
  const [data, setData] = useState<SensorData[]>([]);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [isModalVisible, setIsModalVisible] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState<LoginData>({
    email: '',
    password: ''
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      setIsAuthenticated(true);
      setIsModalVisible(false);
      setCurrentUser(JSON.parse(user));
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const token = localStorage.getItem('token');
      const socket = io(process.env.NEXT_PUBLIC_WS_URL!, {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000
      });

      socket.on('connect', () => {
        setConnectionStatus('Connected');
      });

      socket.on('disconnect', () => {
        setConnectionStatus('Disconnected');
      });

      socket.on('sensor-data', (msg: SensorData) => {
        setData(prev => {
          // Aynı sensor_id'ye sahip kaydı bul
          const existingIndex = prev.findIndex(item => item.sensor_id === msg.sensor_id);
          
          if (existingIndex >= 0) {
            // Var olan kaydı güncelle
            const newData = [...prev];
            newData[existingIndex] = msg;
            return newData;
          } else {
            // Yeni kayıt ekle (ilk 50'yi koru)
            return [msg, ...prev.slice(0, 49)];
          }
        });
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [isAuthenticated]);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch( process.env.NEXT_PUBLIC_URL + '/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginForm)
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const { access_token, user } = await response.json();
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      setIsAuthenticated(true);
      setIsModalVisible(false);
      setCurrentUser(user);
      message.success('Login successful!');
    } catch (error) {
      message.error('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setIsModalVisible(true);
    setCurrentUser(null);
    setData([]);
  };

  const getTempColor = (temp: number) => {
    if (temp > 30) return 'red';
    if (temp < 10) return 'blue';
    return 'green';
  };

  const getHumidityColor = (humidity: number) => {
    if (humidity > 70) return 'blue';
    if (humidity < 30) return 'orange';
    return 'green';
  };

  const isAdmin = () => {
    return currentUser?.role.name === 'SystemAdmin' || currentUser?.role.name === 'CompanyAdmin';
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: '1',
      label: (
        <div className="p-2">
          <p className="font-semibold">{currentUser?.name || currentUser?.email}</p>
          <Tag color={currentUser?.role.name === 'SystemAdmin' ? 'red' : 'orange'}>
            {currentUser?.role.name}
          </Tag>
          {currentUser?.company && (
            <p className="text-sm">{currentUser.company.name}</p>
          )}
        </div>
      ),
      disabled: true
    },
    {
      type: 'divider',
    },
    {
      key: '3',
      label: 'Logout',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogout
    }
  ];

  const columns = [
    {
      title: 'Sensor ID',
      dataIndex: 'sensor_id',
      key: 'sensor_id',
      render: (text: string) => <Tag color="geekblue">{text}</Tag>,
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: number) => new Date(timestamp * 1000).toLocaleString(),
    },
    {
      title: 'Temperature (°C)',
      dataIndex: 'temperature',
      key: 'temperature',
      render: (temp: number) => (
        <Tag color={getTempColor(temp)}>
          {temp.toFixed(1)}°C
        </Tag>
      ),
    },
    {
      title: 'Humidity (%)',
      dataIndex: 'humidity',
      key: 'humidity',
      render: (humidity: number) => (
        <Tag color={getHumidityColor(humidity)}>
          {humidity.toFixed(1)}%
        </Tag>
      ),
    },
  ];

  const stats = [
    {
      title: 'Active Sensors',
      value: new Set(data.map(d => d.sensor_id)).size,
      icon: <DashboardOutlined />,
      color: 'blue',
    },
    {
      title: 'Avg Temperature',
      value: data.length ? (data.reduce((acc, curr) => acc + curr.temperature, 0) / data.length).toFixed(1) + '°C' : '-',
      icon: <DashboardOutlined />,
      color: getTempColor(data.length ? data.reduce((acc, curr) => acc + curr.temperature, 0) / data.length : 0),
    },
    {
      title: 'Avg Humidity',
      value: data.length ? (data.reduce((acc, curr) => acc + curr.humidity, 0) / data.length).toFixed(1) + '%' : '-',
      icon: <DashboardOutlined />,
      color: getHumidityColor(data.length ? data.reduce((acc, curr) => acc + curr.humidity, 0) / data.length : 0),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {!isAuthenticated ? (
        <Modal
          title={
            <div className="flex items-center">
              <span>Patreon IoT Dashboard Login</span>
            </div>
          }
          visible={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
          closable={false}
          centered
        >
          <div className="space-y-4">
            <Input
              prefix={<MailOutlined className="text-gray-300" />}
              placeholder="Email"
              size="large"
              value={loginForm.email}
              onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
            />
            <Input.Password
              prefix={<LockOutlined className="text-gray-300" />}
              placeholder="Password"
              size="large"
              value={loginForm.password}
              onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
            />
            <Button
              type="primary"
              block
              size="large"
              loading={loading}
              onClick={handleLogin}
              icon={<MailOutlined />}
            >
              Login
            </Button>
          </div>
        </Modal>
      ) : (
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-800">Patrion IoT Sensor Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Tag color={connectionStatus === 'Connected' ? 'green' : 'red'}>
                {connectionStatus}
              </Tag>
              
              {isAdmin() && (
                <Button 
                  icon={<SettingOutlined />}
                  type="primary"
                  onClick={() => router.push('/panel')}
                >
                  Admin Panel
                </Button>
              )}
              
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <Button type="text" className="flex items-center">
                  <UserOutlined />
                  <span className="ml-2">{currentUser?.name || currentUser?.email.split('@')[0]}</span>
                  <DownOutlined className="ml-1" />
                </Button>
              </Dropdown>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, index) => (
              <Card key={index} className="shadow-md">
                <div className="flex items-center">
                  <div className={`mr-4 text-2xl text-${stat.color}-500`}>
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-gray-500">{stat.title}</p>
                    <p className={`text-2xl font-bold text-${stat.color}-500`}>
                      {stat.value}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card title="Real-time Sensor Data" className="shadow-lg">
            <Table
              columns={columns}
              dataSource={data}
              rowKey={(record, index) => `${record.sensor_id}-${index}`}
              pagination={{ pageSize: 10 }}
              scroll={{ x: true }}
              locale={{
                emptyText: 'No sensor data received yet...'
              }}
            />
          </Card>
        </div>
      )}
    </div>
  );
}