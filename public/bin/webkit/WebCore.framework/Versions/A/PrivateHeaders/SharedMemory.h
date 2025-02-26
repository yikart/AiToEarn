/*
 * Copyright (C) 2010-2024 Apple Inc. All rights reserved.
 * Copyright (C) 2017 Sony Interactive Entertainment Inc.
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

#include <wtf/ArgumentCoder.h>
#include <wtf/Forward.h>
#include <wtf/ThreadSafeRefCounted.h>

#if USE(UNIX_DOMAIN_SOCKETS)
#include <wtf/unix/UnixFileDescriptor.h>
#endif

#if OS(WINDOWS)
#include <wtf/win/Win32Handle.h>
#endif

#if OS(DARWIN)
#include <wtf/MachSendRight.h>
#endif

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

#if PLATFORM(COCOA)
OBJC_CLASS NSData;
#endif

namespace WebCore {

class FragmentedSharedBuffer;
class ProcessIdentity;
class SharedBuffer;

enum class MemoryLedger { None, Default, Network, Media, Graphics, Neural };

WEBCORE_EXPORT bool isMemoryAttributionDisabled();

class SharedMemoryHandle {
public:
    using Type =
#if USE(UNIX_DOMAIN_SOCKETS)
        UnixFileDescriptor;
#elif OS(DARWIN)
        MachSendRight;
#elif OS(WINDOWS)
        Win32Handle;
#endif

    SharedMemoryHandle(SharedMemoryHandle&&) = default;
#if USE(UNIX_DOMAIN_SOCKETS)
    explicit SharedMemoryHandle(const SharedMemoryHandle&);
#else
    explicit SharedMemoryHandle(const SharedMemoryHandle&) = default;
#endif
    WEBCORE_EXPORT SharedMemoryHandle(SharedMemoryHandle::Type&&, size_t);

    SharedMemoryHandle& operator=(SharedMemoryHandle&&) = default;

    size_t size() const { return m_size; }

    // Take ownership of the memory for process memory accounting purposes.
    WEBCORE_EXPORT void takeOwnershipOfMemory(MemoryLedger) const;
    // Transfer ownership of the memory for process memory accounting purposes.
    WEBCORE_EXPORT void setOwnershipOfMemory(const WebCore::ProcessIdentity&, MemoryLedger) const;

#if USE(UNIX_DOMAIN_SOCKETS)
    UnixFileDescriptor releaseHandle();
#endif

private:
    friend struct IPC::ArgumentCoder<SharedMemoryHandle, void>;
    friend class SharedMemory;

    Type m_handle;
    size_t m_size { 0 };
};

class SharedMemory : public ThreadSafeRefCounted<SharedMemory> {
public:
    using Handle = SharedMemoryHandle;

    enum class Protection : bool { ReadOnly, ReadWrite };

    // FIXME: Change these factory functions to return Ref<SharedMemory> and crash on failure.
    WEBCORE_EXPORT static RefPtr<SharedMemory> allocate(size_t);
    WEBCORE_EXPORT static RefPtr<SharedMemory> copyBuffer(const WebCore::FragmentedSharedBuffer&);
    WEBCORE_EXPORT static RefPtr<SharedMemory> copySpan(std::span<const uint8_t>);
    WEBCORE_EXPORT static RefPtr<SharedMemory> map(Handle&&, Protection);
#if USE(UNIX_DOMAIN_SOCKETS)
    WEBCORE_EXPORT static RefPtr<SharedMemory> wrapMap(void*, size_t, int fileDescriptor);
#elif OS(DARWIN)
    WEBCORE_EXPORT static RefPtr<SharedMemory> wrapMap(std::span<const uint8_t>, Protection);
#endif

    WEBCORE_EXPORT ~SharedMemory();

    WEBCORE_EXPORT std::optional<Handle> createHandle(Protection);

    size_t size() const { return m_size; }

    std::span<const uint8_t> span() const { return { static_cast<const uint8_t*>(m_data), m_size }; }
    std::span<uint8_t> mutableSpan() const { return { static_cast<uint8_t*>(m_data), m_size }; }

#if OS(WINDOWS)
    HANDLE handle() const { return m_handle.get(); }
#endif

#if PLATFORM(COCOA)
    Protection protection() const { return m_protection; }
    WEBCORE_EXPORT RetainPtr<NSData> toNSData() const;
#endif

    WEBCORE_EXPORT Ref<WebCore::SharedBuffer> createSharedBuffer(size_t) const;

private:
#if OS(DARWIN)
    MachSendRight createSendRight(Protection) const;
#endif

    size_t m_size;
    void* m_data;
#if PLATFORM(COCOA)
    Protection m_protection;
#endif

#if USE(UNIX_DOMAIN_SOCKETS)
    UnixFileDescriptor m_fileDescriptor;
    bool m_isWrappingMap { false };
#elif OS(DARWIN)
    MachSendRight m_sendRight;
#elif OS(WINDOWS)
    Win32Handle m_handle;
#endif
};

} // namespace WebCore

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
