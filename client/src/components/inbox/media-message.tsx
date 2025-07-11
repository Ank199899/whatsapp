import React, { useState } from 'react';
import { Download, FileText, Image, Video, Music, File, Eye, X, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GlassContainer } from '@/components/ui/modern-effects';

interface MediaMessageProps {
  mediaUrl: string;
  mediaType: string;
  mediaFilename?: string;
  mediaSize?: number;
  content: string;
  direction: 'incoming' | 'outgoing';
  timestamp?: string;
  status?: 'sent' | 'delivered' | 'read';
}

export function MediaMessage({
  mediaUrl,
  mediaType,
  mediaFilename,
  mediaSize,
  content,
  direction,
  timestamp,
  status
}: MediaMessageProps) {
  const [showPreview, setShowPreview] = useState(false);

  // Debug logging
  console.log('🎬 MediaMessage props:', {
    mediaUrl: mediaUrl ? `${mediaUrl.substring(0, 50)}...` : 'null',
    mediaType,
    mediaFilename,
    mediaSize,
    content
  });

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // If no media URL, show a placeholder or fallback
  if (!mediaUrl) {
    return (
      <div className={`max-w-sm rounded-xl shadow-sm transition-all duration-200 hover:shadow-md ${
        direction === 'outgoing'
          ? 'bg-green-600 text-white'
          : 'bg-white border border-border/50 text-foreground'
      }`}>
        <div className="p-4">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              direction === 'outgoing'
                ? 'bg-white/20'
                : 'bg-muted/50'
            }`}>
              <File className={`w-5 h-5 ${
                direction === 'outgoing' ? 'text-white' : 'text-muted-foreground'
              }`} />
            </div>
            <div>
              <p className={`text-sm font-semibold ${
                direction === 'outgoing' ? 'text-white' : 'text-foreground'
              }`}>
                Media File
              </p>
              <p className={`text-xs ${
                direction === 'outgoing' ? 'text-white/80' : 'text-muted-foreground'
              }`}>
                {mediaFilename || content || 'No media available'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getMediaIcon = () => {
    if (mediaType?.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (mediaType?.startsWith('video/')) return <Video className="w-4 h-4" />;
    if (mediaType?.startsWith('audio/')) return <Music className="w-4 h-4" />;
    if (mediaType?.includes('pdf')) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const getFileTypeBadge = () => {
    if (mediaType?.includes('pdf')) return 'PDF';
    if (mediaType?.includes('word') || mediaType?.includes('doc')) return 'DOC';
    if (mediaType?.includes('excel') || mediaType?.includes('sheet')) return 'XLS';
    if (mediaType?.includes('powerpoint') || mediaType?.includes('presentation')) return 'PPT';
    if (mediaType?.includes('text')) return 'TXT';
    if (mediaType?.includes('zip') || mediaType?.includes('rar')) return 'ZIP';
    if (mediaType?.includes('image')) return 'IMG';
    if (mediaType?.includes('video')) return 'VID';
    if (mediaType?.includes('audio')) return 'AUD';

    // Handle octet-stream and unknown types
    if (mediaType?.includes('octet-stream') || !mediaType || mediaType.trim() === '') {
      // Try to get extension from filename
      if (mediaFilename) {
        const ext = mediaFilename.split('.').pop()?.toUpperCase();
        if (ext && ext.length <= 4) return ext;
      }
      return 'FILE';
    }

    const extension = mediaType?.split('/')[1]?.toUpperCase();
    // Don't show long or weird extensions
    if (extension && extension.length <= 4 && !extension.includes('STREAM')) {
      return extension;
    }
    return 'FILE';
  };

  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = mediaUrl;
      link.download = mediaFilename || `media_${Date.now()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab
      window.open(mediaUrl, '_blank');
    }
  };

  const handleOpen = () => {
    try {
      console.log('🔍 Opening media:', { mediaUrl: mediaUrl?.substring(0, 50) + '...', mediaType });

      if (!mediaUrl) {
        console.error('❌ No media URL available');
        return;
      }

      // For data URLs, create a blob and open it
      if (mediaUrl.startsWith('data:')) {
        try {
          // Extract the base64 data
          const [header, base64Data] = mediaUrl.split(',');
          const mimeType = header.match(/data:([^;]+)/)?.[1] || mediaType || 'application/octet-stream';

          // Convert base64 to blob
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: mimeType });

          // Create object URL and open it
          const objectUrl = URL.createObjectURL(blob);
          const newWindow = window.open(objectUrl, '_blank');

          if (!newWindow) {
            console.warn('⚠️ Popup blocked, trying alternative method');
            // Fallback: create a temporary link and click it
            const link = document.createElement('a');
            link.href = objectUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }

          // Clean up the object URL after a delay
          setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);

        } catch (error) {
          console.error('❌ Error processing data URL:', error);
          // Fallback to direct window.open
          window.open(mediaUrl, '_blank');
        }
      } else {
        // For regular URLs, open directly
        const newWindow = window.open(mediaUrl, '_blank');
        if (!newWindow) {
          console.warn('⚠️ Popup blocked for regular URL');
        }
      }
    } catch (error) {
      console.error('❌ Error opening media:', error);
    }
  };

  const handleSaveAs = () => {
    handleDownload();
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const renderMediaPreview = () => {
    if (mediaType?.startsWith('image/')) {
      return (
        <div className="relative group overflow-hidden rounded-xl max-w-xs">
          <img
            src={mediaUrl}
            alt={content || 'Image'}
            className="w-full max-h-64 object-cover rounded-xl cursor-pointer hover:scale-105 transition-all duration-300 shadow-lg"
            onClick={handlePreview}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl flex items-end justify-center pb-4">
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleOpen}
                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-none rounded-lg transition-all duration-300 hover:scale-105"
              >
                <Eye className="w-4 h-4 mr-1" />
                View
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSaveAs}
                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-none rounded-lg transition-all duration-300 hover:scale-105"
              >
                <Download className="w-4 h-4 mr-1" />
                Save as...
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (mediaType?.startsWith('video/')) {
      return (
        <div className="relative group overflow-hidden rounded-xl max-w-xs">
          <video
            src={mediaUrl}
            controls
            className="w-full max-h-64 rounded-xl shadow-lg"
            preload="metadata"
          />
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpen}
              className="bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white border-none rounded-lg transition-all duration-300 hover:scale-105"
            >
              <Play className="w-4 h-4 mr-1" />
              Open
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveAs}
              className="bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white border-none rounded-lg transition-all duration-300 hover:scale-105"
            >
              <Download className="w-4 h-4 mr-1" />
              Save as...
            </Button>
          </div>
        </div>
      );
    }

    if (mediaType?.startsWith('audio/')) {
      return (
        <div className={`max-w-sm rounded-xl shadow-sm transition-all duration-200 hover:shadow-md ${
          direction === 'outgoing'
            ? 'bg-green-600 text-white'
            : 'bg-white border border-border/50 text-foreground'
        }`}>
          <div className="p-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                direction === 'outgoing'
                  ? 'bg-white/20'
                  : 'bg-purple-100'
              }`}>
                <Music className={`w-6 h-6 ${
                  direction === 'outgoing' ? 'text-white' : 'text-purple-600'
                }`} />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-semibold truncate ${
                  direction === 'outgoing' ? 'text-white' : 'text-foreground'
                }`}>
                  {mediaFilename || 'Audio File'}
                </p>
                <p className={`text-xs ${
                  direction === 'outgoing' ? 'text-white/80' : 'text-muted-foreground'
                }`}>
                  {mediaSize && formatFileSize(mediaSize)} • Audio
                </p>
              </div>
            </div>
            <audio src={mediaUrl} controls className="w-full mb-4 rounded-lg" />
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleOpen}
                className={`flex-1 border-none rounded-lg transition-all duration-300 hover:scale-105 ${
                  direction === 'outgoing'
                    ? 'bg-white/20 hover:bg-white/30 text-white'
                    : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
                }`}
              >
                <Play className="w-4 h-4 mr-1" />
                Open
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSaveAs}
                className={`flex-1 border-none rounded-lg transition-all duration-300 hover:scale-105 ${
                  direction === 'outgoing'
                    ? 'bg-white/20 hover:bg-white/30 text-white'
                    : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
                }`}
              >
                <Download className="w-4 h-4 mr-1" />
                Save as...
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Document/File preview with WhatsApp-style design
    return (
      <div className={`max-w-sm rounded-xl shadow-sm transition-all duration-200 hover:shadow-md ${
        direction === 'outgoing'
          ? 'bg-green-600 text-white'
          : 'bg-white border border-border/50 text-foreground'
      }`}>
        {/* File Type Badge */}
        <div className="absolute top-2 right-2 z-10">
          <Badge className={`text-xs px-2 py-1 rounded-full font-semibold ${
            direction === 'outgoing'
              ? 'bg-white/20 text-white'
              : 'bg-red-500 text-white'
          }`}>
            {getFileTypeBadge()}
          </Badge>
        </div>

        {/* File Content */}
        <div className="p-4">
          {/* File Icon and Info */}
          <div className="flex items-center space-x-3 mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              direction === 'outgoing'
                ? 'bg-white/20'
                : 'bg-primary/10'
            }`}>
              <div className={`scale-125 ${
                direction === 'outgoing' ? 'text-white' : 'text-primary'
              }`}>
                {getMediaIcon()}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate ${
                direction === 'outgoing' ? 'text-white' : 'text-foreground'
              }`}>
                {mediaFilename || 'Document'}
              </p>
              <p className={`text-xs ${
                direction === 'outgoing' ? 'text-white/80' : 'text-muted-foreground'
              }`}>
                {mediaSize && formatFileSize(mediaSize)} • {getFileTypeBadge()} Document
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 mb-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleOpen}
              className={`flex-1 border-none rounded-lg transition-all duration-300 hover:scale-105 ${
                direction === 'outgoing'
                  ? 'bg-white/20 hover:bg-white/30 text-white'
                  : 'bg-primary/10 hover:bg-primary/20 text-primary'
              }`}
            >
              <Eye className="w-4 h-4 mr-1" />
              Open
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSaveAs}
              className={`flex-1 border-none rounded-lg transition-all duration-300 hover:scale-105 ${
                direction === 'outgoing'
                  ? 'bg-white/20 hover:bg-white/30 text-white'
                  : 'bg-primary/10 hover:bg-primary/20 text-primary'
              }`}
            >
              <Download className="w-4 h-4 mr-1" />
              Save as...
            </Button>
          </div>

          {/* Timestamp and Status */}
          {timestamp && (
            <div className="flex items-center justify-end space-x-2">
              <span className={`text-xs ${
                direction === 'outgoing' ? 'text-white/70' : 'text-muted-foreground'
              }`}>
                {new Date(timestamp).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })}
              </span>
              {direction === 'outgoing' && status && (
                <div className="flex">
                  {status === 'sent' && (
                    <svg className="w-4 h-4 text-white/70" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {status === 'delivered' && (
                    <div className="flex">
                      <svg className="w-4 h-4 text-white/70" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <svg className="w-4 h-4 text-white/70 -ml-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  {status === 'read' && (
                    <div className="flex">
                      <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <svg className="w-4 h-4 text-blue-400 -ml-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="space-y-3">
        {renderMediaPreview()}
        {content && content !== '[Media]' && content !== '📷 Image' && content !== '🎥 Video' && content !== '🎵 Audio' && !content.startsWith('📄') && (
          <p className="text-sm text-foreground/80 leading-relaxed">{content}</p>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-auto bg-card/95 backdrop-blur-md border border-border/50">
          <DialogHeader className="border-b border-border/30 pb-4">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                  {getMediaIcon()}
                </div>
                <span className="font-semibold text-foreground">{mediaFilename || 'Media Preview'}</span>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpen}
                  className="hover:scale-105 transition-all duration-300"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Open
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveAs}
                  className="hover:scale-105 transition-all duration-300"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Save
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(false)}
                  className="hover:scale-105 transition-all duration-300"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-center p-6 bg-gradient-to-br from-background/50 to-background-secondary/30 rounded-xl">
            {mediaType?.startsWith('image/') && (
              <img
                src={mediaUrl}
                alt={content || 'Image Preview'}
                className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl"
              />
            )}

            {mediaType?.startsWith('video/') && (
              <video
                src={mediaUrl}
                controls
                className="max-w-full max-h-[75vh] rounded-xl shadow-2xl"
                autoPlay
              />
            )}

            {mediaType?.includes('pdf') && (
              <iframe
                src={mediaUrl}
                className="w-full h-[70vh] rounded-lg border"
                title="PDF Preview"
              />
            )}

            {mediaType?.startsWith('audio/') && (
              <div className="w-full max-w-md">
                <audio src={mediaUrl} controls className="w-full" autoPlay />
                <div className="mt-4 text-center">
                  <Music className="w-16 h-16 mx-auto text-blue-500 mb-2" />
                  <p className="text-lg font-medium">{mediaFilename || 'Audio File'}</p>
                  {mediaSize && (
                    <p className="text-sm text-gray-500">{formatFileSize(mediaSize)}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
