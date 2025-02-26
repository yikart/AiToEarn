/*
 * Copyright (C) 2010 Google Inc. All rights reserved.
 * Copyright (C) 2013, 2014, 2016 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include <optional>
#include <wtf/Forward.h>

namespace WebCore {

class BlobDataFileReference;
class BlobPart;
class BlobRegistry;
class BlobRegistryImpl;
class SecurityOriginData;

struct PolicyContainer;

WEBCORE_EXPORT BlobRegistry& blobRegistry();

// BlobRegistry is not thread-safe. It should only be called from main thread.
class WEBCORE_EXPORT BlobRegistry {
public:

    // Registers a blob URL referring to the specified file.
    virtual void registerInternalFileBlobURL(const URL&, Ref<BlobDataFileReference>&&, const String& path, const String& contentType) = 0;

    // Registers a blob URL referring to the specified blob data.
    virtual void registerInternalBlobURL(const URL&, Vector<BlobPart>&&, const String& contentType) = 0;
    
    // Registers a new blob URL referring to the blob data identified by the specified srcURL.
    virtual void registerBlobURL(const URL&, const URL& srcURL, const PolicyContainer&, const std::optional<SecurityOriginData>& topOrigin) = 0;

    // Registers a new blob URL referring to the blob data identified by the specified srcURL or, if none found, referring to the file found at the given path.
    virtual void registerInternalBlobURLOptionallyFileBacked(const URL&, const URL& srcURL, RefPtr<BlobDataFileReference>&&, const String& contentType) = 0;

    // Negative start and end values select from the end.
    virtual void registerInternalBlobURLForSlice(const URL&, const URL& srcURL, long long start, long long end, const String& contentType) = 0;

    virtual void unregisterBlobURL(const URL&, const std::optional<SecurityOriginData>& topOrigin) = 0;

    virtual void registerBlobURLHandle(const URL&, const std::optional<SecurityOriginData>& topOrigin) = 0;
    virtual void unregisterBlobURLHandle(const URL&, const std::optional<SecurityOriginData>& topOrigin) = 0;

    virtual String blobType(const URL&) = 0;

    virtual unsigned long long blobSize(const URL&) = 0;

    virtual void writeBlobsToTemporaryFilesForIndexedDB(const Vector<String>& blobURLs, CompletionHandler<void(Vector<String>&& filePaths)>&&) = 0;

    virtual BlobRegistryImpl* blobRegistryImpl() { return nullptr; }

protected:
    virtual ~BlobRegistry();
};

} // namespace WebCore
