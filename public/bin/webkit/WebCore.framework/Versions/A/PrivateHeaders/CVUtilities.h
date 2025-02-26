/*
 * Copyright (C) 2021 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include <CoreVideo/CoreVideo.h>
#include <utility>
#include <wtf/Expected.h>
#include <wtf/RetainPtr.h>

using CGColorSpaceRef = struct CGColorSpace*;
using CVPixelBufferPoolRef = struct __CVPixelBufferPool*;
using CVPixelBufferRef = struct __CVBuffer*;

namespace WebCore {
class ProcessIdentity;

// Creates CVPixelBufferPool that creates CVPixelBuffers backed by IOSurfaces.
// These buffers can be for example sent through IPC.
WEBCORE_EXPORT Expected<RetainPtr<CVPixelBufferPoolRef>, CVReturn> createIOSurfaceCVPixelBufferPool(size_t width, size_t height, OSType pixelFormat, unsigned minimumBufferCount = 0u, bool isCGImageCompatible = false);

WEBCORE_EXPORT Expected<RetainPtr<CVPixelBufferPoolRef>, CVReturn> createInMemoryCVPixelBufferPool(size_t width, size_t height, OSType pixelFormat, unsigned minimumBufferCount = 0u, bool isCGImageCompatible = false);

WEBCORE_EXPORT Expected<RetainPtr<CVPixelBufferPoolRef>, CVReturn> createCVPixelBufferPool(size_t width, size_t height, OSType pixelFormat, unsigned minimumBufferCount = 0u, bool isCGImageCompatible = false, bool shouldUseIOSUrface = true);

WEBCORE_EXPORT Expected<RetainPtr<CVPixelBufferRef>, CVReturn> createCVPixelBufferFromPool(CVPixelBufferPoolRef, unsigned maximumBufferCount = 0u);

WEBCORE_EXPORT Expected<RetainPtr<CVPixelBufferRef>, CVReturn> createCVPixelBuffer(IOSurfaceRef);

WEBCORE_EXPORT RetainPtr<CGColorSpaceRef> createCGColorSpaceForCVPixelBuffer(CVPixelBufferRef);

// Should be called with non-empty ProcessIdentity.
WEBCORE_EXPORT void setOwnershipIdentityForCVPixelBuffer(CVPixelBufferRef, const ProcessIdentity&);

WEBCORE_EXPORT RetainPtr<CVPixelBufferRef> createBlackPixelBuffer(size_t width, size_t height, bool shouldUseIOSurface = false);

}
