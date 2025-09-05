import React from 'react';
import { render, screen } from '@testing-library/react';
import TikTokParams from './TikTokParams';

// Mock the dependencies
jest.mock('@/app/i18n/client', () => ({
  useTransClient: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@/components/PublishDialog/compoents/PlatParamsSetting/hooks/usePlatParamsCoomon', () => ({
  __esModule: true,
  default: () => ({
    pubParmasTextareaCommonParams: {},
    setOnePubParams: jest.fn(),
  }),
}));

jest.mock('@/utils/request', () => ({
  apiRequest: {
    get: jest.fn(),
  },
}));

// Mock PubParmasTextarea component
jest.mock('@/components/PublishDialog/compoents/PubParmasTextarea', () => {
  return function MockPubParmasTextarea({ extend }: { extend: React.ReactNode }) {
    return <div data-testid="pub-params-textarea">{extend}</div>;
  };
});

// Mock CommonTitleInput component
jest.mock('@/components/PublishDialog/compoents/PlatParamsSetting/common/CommonTitleInput', () => {
  return function MockCommonTitleInput() {
    return <div data-testid="common-title-input">Title Input</div>;
  };
});

describe('TikTokParams', () => {
  const mockPubItem = {
    account: {
      id: 'test-account-id',
      account: 'test-tiktok-account',
      type: 'tiktok',
    },
    params: {
      option: {
        tiktok: {
          privacy_level: '',
          comment_disabled: false,
          duet_disabled: false,
          stitch_disabled: false,
          brand_organic_toggle: false,
          brand_content_toggle: false,
        },
      },
    },
  };

  it('renders TikTokParams component', () => {
    render(<TikTokParams pubItem={mockPubItem} />);
    
    expect(screen.getByTestId('pub-params-textarea')).toBeInTheDocument();
    expect(screen.getByTestId('common-title-input')).toBeInTheDocument();
  });

  it('displays creator info section', () => {
    render(<TikTokParams pubItem={mockPubItem} />);
    
    // Check if creator info label is present
    expect(screen.getByText('tiktok.creatorInfo')).toBeInTheDocument();
  });

  it('displays privacy level section', () => {
    render(<TikTokParams pubItem={mockPubItem} />);
    
    // Check if privacy level label is present
    expect(screen.getByText('tiktok.privacy.title')).toBeInTheDocument();
  });

  it('displays interactions section', () => {
    render(<TikTokParams pubItem={mockPubItem} />);
    
    // Check if interactions label is present
    expect(screen.getByText('tiktok.interactions.title')).toBeInTheDocument();
  });

  it('displays commercial content section', () => {
    render(<TikTokParams pubItem={mockPubItem} />);
    
    // Check if commercial content label is present
    expect(screen.getByText('tiktok.commercial.title')).toBeInTheDocument();
  });
});
