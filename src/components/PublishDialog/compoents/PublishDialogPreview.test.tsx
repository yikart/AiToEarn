import React from 'react';
import { render, screen } from '@testing-library/react';
import PublishDialogPreview from './PublishDialogPreview';

// Mock the dependencies
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@/components/PublishDialog/usePublishDialog', () => ({
  usePublishDialog: () => ({
    expandedPubItem: {
      params: {
        video: {
          filename: 'test-video.mp4',
          width: 1920,
          height: 1080,
          size: 1048576, // 1MB
          duration: 120, // 2 minutes
          videoUrl: 'https://example.com/video.mp4',
          cover: {
            imgUrl: 'https://example.com/cover.jpg'
          }
        }
      }
    }
  }),
}));

// Mock Swiper components
jest.mock('swiper/react', () => ({
  Swiper: ({ children }: { children: React.ReactNode }) => <div data-testid="swiper">{children}</div>,
  SwiperSlide: ({ children }: { children: React.ReactNode }) => <div data-testid="swiper-slide">{children}</div>,
}));

jest.mock('swiper/modules', () => ({
  Navigation: {},
  Pagination: {},
}));

describe('PublishDialogPreview', () => {
  it('renders video information correctly', () => {
    render(<PublishDialogPreview />);
    
    // Check if video info labels are present
    expect(screen.getByText('preview.videoInfo.filename:')).toBeInTheDocument();
    expect(screen.getByText('preview.videoInfo.format:')).toBeInTheDocument();
    expect(screen.getByText('preview.videoInfo.resolution:')).toBeInTheDocument();
    expect(screen.getByText('preview.videoInfo.size:')).toBeInTheDocument();
    expect(screen.getByText('preview.videoInfo.duration:')).toBeInTheDocument();
    
    // Check if video info values are present
    expect(screen.getByText('test-video.mp4')).toBeInTheDocument();
    expect(screen.getByText('MP4')).toBeInTheDocument();
    expect(screen.getByText('1920x1080')).toBeInTheDocument();
    expect(screen.getByText('1 MB')).toBeInTheDocument();
    expect(screen.getByText('2:00')).toBeInTheDocument();
  });

  it('formats file size correctly', () => {
    // Test the formatFileSize function indirectly through the component
    render(<PublishDialogPreview />);
    
    // Check if 1MB is formatted as "1 MB"
    expect(screen.getByText('1 MB')).toBeInTheDocument();
  });

  it('formats duration correctly', () => {
    // Test the formatDuration function indirectly through the component
    render(<PublishDialogPreview />);
    
    // Check if 120 seconds is formatted as "2:00"
    expect(screen.getByText('2:00')).toBeInTheDocument();
  });
});
