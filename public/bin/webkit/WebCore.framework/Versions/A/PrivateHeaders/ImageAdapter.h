/*
 * Copyright (C) 2024 Apple Inc.  All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#if USE(APPKIT)
OBJC_CLASS NSImage;
#endif

#if ENABLE(MULTI_REPRESENTATION_HEIC)
OBJC_CLASS NSAdaptiveImageGlyph;
#endif

#if USE(CG)
struct CGContext;
#endif

#if PLATFORM(GTK)
#include <wtf/glib/GRefPtr.h>
typedef struct _GdkPixbuf GdkPixbuf;
#if USE(GTK4)
typedef struct _GdkTexture GdkTexture;
#endif
#endif

#if PLATFORM(WIN)
typedef struct tagSIZE SIZE;
typedef SIZE* LPSIZE;
typedef struct HBITMAP__ *HBITMAP;
#endif

#include <wtf/Ref.h>
#include <wtf/RefPtr.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/Vector.h>
#include <wtf/WeakRef.h>

#if USE(CG) || USE(APPKIT)
#include <wtf/RetainPtr.h>
#endif

namespace WebCore {

class Image;
class IntSize;
class NativeImage;

class ImageAdapter {
    WTF_MAKE_TZONE_ALLOCATED(ImageAdapter);
public:
    ImageAdapter(Image& image)
        : m_image(image)
    {
    }

    WEBCORE_EXPORT static Ref<Image> loadPlatformResource(const char* name);
#if PLATFORM(WIN)
    WEBCORE_EXPORT static RefPtr<NativeImage> nativeImageOfHBITMAP(HBITMAP);
#endif

#if USE(APPKIT)
    WEBCORE_EXPORT NSImage *nsImage();
    WEBCORE_EXPORT RetainPtr<NSImage> snapshotNSImage();
#endif

#if PLATFORM(COCOA)
    WEBCORE_EXPORT CFDataRef tiffRepresentation();
#endif

#if ENABLE(MULTI_REPRESENTATION_HEIC)
    NSAdaptiveImageGlyph *multiRepresentationHEIC();
#endif

#if PLATFORM(GTK)
    GRefPtr<GdkPixbuf> gdkPixbuf();
#if USE(GTK4)
    GRefPtr<GdkTexture> gdkTexture();
#endif
#endif

#if PLATFORM(WIN)
    WEBCORE_EXPORT bool getHBITMAP(HBITMAP);
    WEBCORE_EXPORT bool getHBITMAPOfSize(HBITMAP, const IntSize*);
#endif
    void invalidate();

private:
    Image& image() const { return m_image.get(); }

#if PLATFORM(COCOA)
    static RetainPtr<CFDataRef> tiffRepresentation(const Vector<Ref<NativeImage>>&);
#endif

    RefPtr<NativeImage> nativeImageOfSize(const IntSize&);
    Vector<Ref<NativeImage>> allNativeImages();

    WeakRef<Image> m_image;

#if USE(APPKIT)
    mutable RetainPtr<NSImage> m_nsImage; // A cached NSImage of all the frames. Only built lazily if someone actually queries for one.
#endif
#if USE(CG)
    mutable RetainPtr<CFDataRef> m_tiffRep; // Cached TIFF rep for all the frames. Only built lazily if someone queries for one.
#endif
#if ENABLE(MULTI_REPRESENTATION_HEIC)
    mutable RetainPtr<NSAdaptiveImageGlyph> m_multiRepHEIC;
#endif
};

} // namespace WebCore
