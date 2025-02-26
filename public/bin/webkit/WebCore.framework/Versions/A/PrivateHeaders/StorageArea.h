/*
 * Copyright (C) 2008 Apple Inc. All Rights Reserved.
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

#include <wtf/Forward.h>
#include <wtf/RefCounted.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

class LocalFrame;
class SecurityOrigin;
class StorageSyncManager;

enum class StorageType : uint8_t;

class SecurityOriginData;

class StorageArea : public RefCounted<StorageArea> {
public:
    virtual ~StorageArea() = default;

    virtual unsigned length() = 0;
    virtual String key(unsigned index) = 0;
    virtual String item(const String& key) = 0;
    virtual void setItem(LocalFrame& sourceFrame, const String& key, const String& value, bool& quotaException) = 0;
    virtual void removeItem(LocalFrame& sourceFrame, const String& key) = 0;
    virtual void clear(LocalFrame& sourceFrame) = 0;
    virtual bool contains(const String& key) = 0;

    virtual StorageType storageType() const = 0;

    virtual size_t memoryBytesUsedByCache() = 0;

    virtual void incrementAccessCount() { }
    virtual void decrementAccessCount() { }
    virtual void closeDatabaseIfIdle() { }
    virtual void prewarm() { }
};

} // namespace WebCore
