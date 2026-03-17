/**
 * WelcomeLoading - Welcome 页面加载状态
 * 首屏加载时显示的骨架屏
 */

export default function WelcomeLoading() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          border: '3px solid rgba(255, 255, 255, 0.1)',
          borderTopColor: '#fff',
          borderRadius: '50%',
          animation: 'welcome-spin 0.8s linear infinite',
        }}
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes welcome-spin {
              to { transform: rotate(360deg); }
            }
          `,
        }}
      />
    </div>
  )
}
