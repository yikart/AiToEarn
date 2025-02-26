/*
 * Copyright (C) 2021-2024 Apple Inc. All rights reserved.
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

#include "FileSystemStorageConnection.h"
#include "StorageConnection.h"
#include "StorageEstimate.h"
#include "StorageProvider.h"

namespace WebCore {

class DummyStorageProvider final : public StorageProvider {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(DummyStorageProvider, WEBCORE_EXPORT);
public:
    DummyStorageProvider() = default;

private:
    class DummyStorageConnection final : public StorageConnection {
    public:
        static Ref<DummyStorageConnection> create()
        {
            return adoptRef(*new DummyStorageConnection());
        }

        void getPersisted(ClientOrigin&&, StorageConnection::PersistCallback&& completionHandler) final
        {
            completionHandler(false);
        }

        void persist(const ClientOrigin&, StorageConnection::PersistCallback&& completionHandler) final
        {
            completionHandler(false);
        }

        void fileSystemGetDirectory(ClientOrigin&&, StorageConnection::GetDirectoryCallback&& completionHandler) final
        {
            completionHandler(Exception { ExceptionCode::NotSupportedError });
        }

        void getEstimate(ClientOrigin&&, GetEstimateCallback&& completionHandler) final
        {
            completionHandler(Exception { ExceptionCode::NotSupportedError });
        }
    };

    StorageConnection& storageConnection() final
    {
        if (!m_connection)
            m_connection = DummyStorageConnection::create();

        return *m_connection;
    }

    String ensureMediaKeysStorageDirectoryForOrigin(const SecurityOriginData& origin) final
    {
        if (m_mediaKeysStorageDirectory.isEmpty())
            return emptyString();

        auto originDirectory = FileSystem::pathByAppendingComponent(m_mediaKeysStorageDirectory, origin.databaseIdentifier());
        FileSystem::makeAllDirectories(originDirectory);
        return originDirectory;
    }

    void setMediaKeysStorageDirectory(const String& directory) final
    {
        m_mediaKeysStorageDirectory = directory;
    }

    RefPtr<DummyStorageConnection> m_connection;
    String m_mediaKeysStorageDirectory;
};

} // namespace WebCore
