import React from 'react'

/**
 * 用户登录页面属性
 */
export interface LoginPageProps {
  /** 页面标题 */
  title: string
  /** Logo 图片地址 */
  logo?: string
  /** 登录成功回调 */
  onLoginSuccess?: (userData: { username: string; token: string }) => void
  /** 忘记密码链接点击 */
  onForgotPassword?: () => void
  /** 是否显示注册链接 */
  showRegister?: boolean
  /** 注册链接文字 */
  registerText?: string
  /** 背景图片 */
  backgroundImage?: string
  /** 支持的登录方式 */
  loginMethods?: Array<'email' | 'phone' | 'wechat' | 'github'>
  /** 底部版权信息 */
  footer?: React.ReactNode
}

/**
 * 用户登录页面组件
 * 支持多种登录方式和自定义品牌信息
 */
export const LoginPage: React.FC<LoginPageProps> = ({
  title,
  logo,
  onLoginSuccess,
  onForgotPassword,
  showRegister = true,
  registerText = '还没有账号？立即注册',
  backgroundImage,
  loginMethods = ['email'],
  footer,
}) => {
  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onLoginSuccess?.({
      username,
      token: 'mock-token-' + Date.now(),
    })
  }

  return (
    <div
      style={{
        minHeight: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#f3f4f6',
        width: '100%',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          padding: '32px',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '380px',
        }}
      >
        {logo && (
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <img src={logo} alt="logo" style={{ height: '48px' }} />
          </div>
        )}
        <h1 style={{ margin: 0, fontSize: '24px', textAlign: 'center', color: '#111827' }}>
          {title}
        </h1>
        <form onSubmit={handleSubmit} style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '6px', color: '#374151' }}>
              {loginMethods.includes('phone') ? '手机号' : '邮箱'}
            </label>
            <input
              type={loginMethods.includes('phone') ? 'tel' : 'email'}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '14px', color: '#374151' }}>密码</label>
              {onForgotPassword && (
                <button
                  type="button"
                  onClick={onForgotPassword}
                  style={{ fontSize: '12px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  忘记密码？
                </button>
              )}
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: '12px',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            登录
          </button>
        </form>

        {loginMethods.length > 1 && (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>其他登录方式</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
              {loginMethods.filter((m) => m !== 'email' && m !== 'phone').map((method) => (
                <button
                  key={method}
                  type="button"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: '1px solid #e5e7eb',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '18px',
                  }}
                >
                  {method === 'wechat' ? '💬' : method === 'github' ? '🐙' : '🔑'}
                </button>
              ))}
            </div>
          </div>
        )}

        {showRegister && (
          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
            {registerText}
          </div>
        )}

        {footer && (
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e5e7eb', textAlign: 'center', fontSize: '12px', color: '#9ca3af' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export default LoginPage
