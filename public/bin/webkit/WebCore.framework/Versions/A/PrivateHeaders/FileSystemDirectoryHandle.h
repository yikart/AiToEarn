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

#include "FileSystemHandle.h"

namespace WebCore {

class FileSystemFileHandle;
template<typename> class ExceptionOr;

class FileSystemDirectoryHandle final : public FileSystemHandle {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(FileSystemDirectoryHandle);
public:
    struct GetFileOptions {
        bool create { false };
    };

    struct GetDirectoryOptions {
        bool create { false };
    };
    
    struct RemoveOptions {
        bool recursive { false };
    };

    WEBCORE_EXPORT static Ref<FileSystemDirectoryHandle> create(ScriptExecutionContext&, String&&, FileSystemHandleIdentifier, Ref<FileSystemStorageConnection>&&);
    void getFileHandle(const String& name, const GetFileOptions&, DOMPromiseDeferred<IDLInterface<FileSystemFileHandle>>&&);
    void getDirectoryHandle(const String& name, const GetDirectoryOptions&, DOMPromiseDeferred<IDLInterface<FileSystemDirectoryHandle>>&&);
    void removeEntry(const String& name, const RemoveOptions&, DOMPromiseDeferred<void>&&);
    void resolve(const FileSystemHandle&, DOMPromiseDeferred<IDLSequence<IDLUSVString>>&&);

    void getHandleNames(CompletionHandler<void(ExceptionOr<Vector<String>>&&)>&&);
    void getHandle(const String& name, CompletionHandler<void(ExceptionOr<Ref<FileSystemHandle>>&&)>&&);

    class Iterator : public RefCounted<FileSystemDirectoryHandle::Iterator> {
    public:
        static Ref<Iterator> create(FileSystemDirectoryHandle&);
        using Result = std::optional<KeyValuePair<String, Ref<FileSystemHandle>>>;
        void next(CompletionHandler<void(ExceptionOr<Result>&&)>&&);
    private:
        explicit Iterator(FileSystemDirectoryHandle& source)
            : m_source(source)
        {
        }
        void advance(CompletionHandler<void(ExceptionOr<Result>&&)>&&);

        Ref<FileSystemDirectoryHandle> m_source;
        size_t m_index { 0 };
        Vector<String> m_keys;
        bool m_isInitialized { false };
        bool m_isWaitingForResult { false };
    };
    Ref<Iterator> createIterator(ScriptExecutionContext*);

private:
    FileSystemDirectoryHandle(ScriptExecutionContext&, String&&, FileSystemHandleIdentifier, Ref<FileSystemStorageConnection>&&);
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::FileSystemDirectoryHandle)
    static bool isType(const WebCore::FileSystemHandle& handle) { return handle.kind() == WebCore::FileSystemHandle::Kind::Directory; }
SPECIALIZE_TYPE_TRAITS_END()
