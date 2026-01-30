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
        {/* Wikipedia-style header bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 48px',
            borderBottom: '1px solid #a7d7f9',
            background: '#f6f6f6',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Logo placeholder - Wikipedia puzzle globe style */}
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #e0e0e0 0%, #f5f5f5 50%, #d0d0d0 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                border: '2px solid #ccc',
              }}
            >
              📚
            </div>
            <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#000' }}>
              OpenCitation
            </span>
          </div>
          <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: '#0645ad' }}>
            <span>article</span>
            <span>talk</span>
            <span>history</span>
          </div>
        </div>

        {/* Main content area */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            padding: '40px 48px',
            gap: '48px',
          }}
        >
          {/* Left side - Title and tagline */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <h1
              style={{
                fontSize: '52px',
                fontWeight: 'normal',
                color: '#000',
                margin: 0,
                borderBottom: '1px solid #a2a9b1',
                paddingBottom: '12px',
                fontFamily: 'Georgia, serif',
              }}
            >
              OpenCitation
            </h1>
            <p
              style={{
                fontSize: '18px',
                color: '#54595d',
                fontStyle: 'italic',
                marginTop: '8px',
              }}
            >
              From OpenCitation, the free citation tool
            </p>

            <div
              style={{
                marginTop: '32px',
                padding: '20px',
                background: '#f8f9fa',
                border: '1px solid #a2a9b1',
                borderRadius: '2px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#54595d' }}>
                Contents [hide]
              </div>
              <div style={{ fontSize: '15px', color: '#0645ad' }}>1 Generate citations</div>
              <div style={{ fontSize: '15px', color: '#0645ad' }}>2 Organize into lists</div>
              <div style={{ fontSize: '15px', color: '#0645ad' }}>3 Share & export</div>
            </div>

            <p style={{ fontSize: '17px', color: '#202122', marginTop: '24px', lineHeight: 1.6 }}>
              Generate properly formatted citations in{' '}
              <span style={{ color: '#0645ad' }}>APA</span>,{' '}
              <span style={{ color: '#0645ad' }}>MLA</span>,{' '}
              <span style={{ color: '#0645ad' }}>Chicago</span>, and{' '}
              <span style={{ color: '#0645ad' }}>Harvard</span> styles.
            </p>
          </div>

          {/* Right side - Mock citation preview */}
          <div
            style={{
              width: '420px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {/* Tab bar */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid #a2a9b1',
              }}
            >
              <div
                style={{
                  padding: '10px 16px',
                  background: '#fff',
                  borderTop: '1px solid #a2a9b1',
                  borderLeft: '1px solid #a2a9b1',
                  borderRight: '1px solid #a2a9b1',
                  borderBottom: '1px solid #fff',
                  marginBottom: '-1px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                Quick Add
              </div>
              <div
                style={{
                  padding: '10px 16px',
                  background: '#eaecf0',
                  fontSize: '14px',
                  color: '#0645ad',
                }}
              >
                Manual Entry
              </div>
            </div>

            {/* Citation form mock */}
            <div
              style={{
                padding: '20px',
                background: '#f8f9fa',
                border: '1px solid #a2a9b1',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div
                style={{
                  padding: '12px',
                  background: '#fff',
                  border: '1px solid #a2a9b1',
                  fontSize: '14px',
                  color: '#72777d',
                }}
              >
                https://example.com/article
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div
                  style={{
                    padding: '8px 16px',
                    background: '#f8f9fa',
                    border: '1px solid #a2a9b1',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    color: '#0645ad',
                  }}
                >
                  APA
                </div>
                <div
                  style={{
                    padding: '8px 16px',
                    background: '#fff',
                    border: '1px solid #a2a9b1',
                    fontSize: '13px',
                    color: '#54595d',
                  }}
                >
                  MLA
                </div>
                <div
                  style={{
                    padding: '8px 16px',
                    background: '#fff',
                    border: '1px solid #a2a9b1',
                    fontSize: '13px',
                    color: '#54595d',
                  }}
                >
                  Chicago
                </div>
              </div>
            </div>

            {/* Generated citation mock */}
            <div
              style={{
                padding: '16px',
                background: '#fff',
                border: '2px solid #3366cc',
                fontSize: '14px',
                lineHeight: 1.5,
                color: '#202122',
              }}
            >
              Smith, J. (2024). Understanding citations.{' '}
              <span style={{ fontStyle: 'italic' }}>Journal of Research</span>, 15(3), 42-58.
              https://doi.org/10.1234/jr.2024
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <div
                style={{
                  padding: '8px 20px',
                  background: '#3366cc',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 'bold',
                }}
              >
                Copy
              </div>
              <div
                style={{
                  padding: '8px 20px',
                  background: '#fff',
                  border: '1px solid #a2a9b1',
                  color: '#0645ad',
                  fontSize: '13px',
                }}
              >
                Add to List
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 48px',
            background: '#f6f6f6',
            borderTop: '1px solid #a2a9b1',
            fontSize: '13px',
            color: '#54595d',
          }}
        >
          <span>Free & Open Source</span>
          <span>APA • MLA • Chicago • Harvard</span>
          <span>opencitation.vercel.app</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
