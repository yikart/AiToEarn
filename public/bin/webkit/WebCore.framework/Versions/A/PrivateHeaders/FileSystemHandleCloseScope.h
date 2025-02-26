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

#include "FileSystemStorageConnection.h"
#include <wtf/RunLoop.h>

namespace WebCore {

class FileSystemHandleCloseScope : public ThreadSafeRefCounted<FileSystemHandleCloseScope, WTF::DestructionThread::MainRunLoop> {
public:
    static Ref<FileSystemHandleCloseScope> create(FileSystemHandleIdentifier identifier, bool isDirectory, FileSystemStorageConnection& connection)
    {
        return adoptRef(*new FileSystemHandleCloseScope(identifier, isDirectory, connection));
    }

    ~FileSystemHandleCloseScope()
    {
        ASSERT(RunLoop::isMain());

        if (m_identifier)
            m_connection->closeHandle(*m_identifier);
    }

    std::pair<FileSystemHandleIdentifier, bool> release()
    {
        Locker locker { m_lock };
        ASSERT_WITH_MESSAGE(!!m_identifier, "FileSystemHandleCloseScope should not be released more than once");
        return { *std::exchange(m_identifier, std::nullopt), m_isDirectory };
    }

private:
    FileSystemHandleCloseScope(FileSystemHandleIdentifier identifier, bool isDirectory, FileSystemStorageConnection& connection)
        : m_identifier(identifier)
        , m_isDirectory(isDirectory)
        , m_connection(Ref { connection })
    {
        ASSERT(RunLoop::isMain());
    }

    Lock m_lock;
    Markable<FileSystemHandleIdentifier> m_identifier WTF_GUARDED_BY_LOCK(m_lock);
    bool m_isDirectory;
    Ref<FileSystemStorageConnection> m_connection;
};

} // namespace WebCore
