import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'OpenCitation - Free Citation Generator'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#ffffff',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        {/* Wikipedia-style blue header accent */}
        <div
          style={{
            height: '8px',
            background: '#3366cc',
          }}
        />

        {/* Main content */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px',
            gap: '64px',
          }}
        >
          {/* Left side - Logo and branding */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '24px',
            }}
          >
            {/* Logo */}
            <div
              style={{
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                background: 'linear-gradient(145deg, #f0f0f0 0%, #e0e0e0 50%, #d0d0d0 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '64px',
                border: '3px solid #ccc',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            >
              📚
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h1
                style={{
                  fontSize: '56px',
                  fontWeight: 'normal',
                  color: '#000',
                  margin: 0,
                  fontFamily: 'Georgia, serif',
                }}
              >
                OpenCitation
              </h1>
              <p
                style={{
                  fontSize: '20px',
                  color: '#54595d',
                  fontStyle: 'italic',
                  marginTop: '8px',
                }}
              >
                The free citation generator
              </p>
            </div>
          </div>

          {/* Divider */}
          <div
            style={{
              width: '1px',
              height: '300px',
              background: '#a2a9b1',
            }}
          />

          {/* Right side - Features */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {/* Feature boxes */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px 24px',
                background: '#f8f9fa',
                border: '1px solid #a2a9b1',
              }}
            >
              <span style={{ fontSize: '28px' }}>✨</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#202122' }}>
                  Generate Citations
                </span>
                <span style={{ fontSize: '14px', color: '#54595d' }}>
                  From URLs, DOIs, or ISBNs
                </span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px 24px',
                background: '#f8f9fa',
                border: '1px solid #a2a9b1',
              }}
            >
              <span style={{ fontSize: '28px' }}>📁</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#202122' }}>
                  Organize & Share
                </span>
                <span style={{ fontSize: '14px', color: '#54595d' }}>
                  Lists, projects, public links
                </span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px 24px',
                background: '#f8f9fa',
                border: '1px solid #a2a9b1',
              }}
            >
              <span style={{ fontSize: '28px' }}>📝</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#202122' }}>
                  4 Citation Styles
                </span>
                <span style={{ fontSize: '14px', color: '#54595d' }}>
                  APA, MLA, Chicago, Harvard
                </span>
              </div>
            </div>

            {/* Style badges */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              {['APA', 'MLA', 'Chicago', 'Harvard'].map((style) => (
                <div
                  key={style}
                  style={{
                    padding: '8px 16px',
                    background: '#3366cc',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 'bold',
                  }}
                >
                  {style}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px 48px',
            background: '#f6f6f6',
            borderTop: '1px solid #a2a9b1',
            gap: '32px',
          }}
        >
          <span style={{ fontSize: '16px', color: '#0645ad', fontWeight: 'bold' }}>
            Free & Open Source
          </span>
          <span style={{ fontSize: '14px', color: '#54595d' }}>•</span>
          <span style={{ fontSize: '16px', color: '#54595d' }}>
            opencitation.vercel.app
          </span>
          <span style={{ fontSize: '14px', color: '#54595d' }}>•</span>
          <span style={{ fontSize: '16px', color: '#0645ad', fontWeight: 'bold' }}>
            No Ads, No Account Required
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
