/*
 * Copyright (C) 2012 Google Inc.  All rights reserved.
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

#include <wtf/TZoneMalloc.h>
#include <wtf/Vector.h>

struct z_stream_s;
typedef z_stream_s z_stream;

namespace WebCore {

class WebSocketDeflater {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(WebSocketDeflater, WEBCORE_EXPORT);
public:
    enum ContextTakeOverMode {
        DoNotTakeOverContext,
        TakeOverContext
    };

    explicit WebSocketDeflater(int windowBits, ContextTakeOverMode = TakeOverContext);
    WEBCORE_EXPORT ~WebSocketDeflater();

    bool initialize();
    bool addBytes(std::span<const uint8_t>);
    bool finish();
    size_t size() const { return m_buffer.size(); }
    std::span<const uint8_t> span() const { return m_buffer.span(); }
    void reset();

private:
    int m_windowBits;
    ContextTakeOverMode m_contextTakeOverMode;
    Vector<uint8_t> m_buffer;
    std::unique_ptr<z_stream> m_stream;
};

class WebSocketInflater {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(WebSocketInflater, WEBCORE_EXPORT);
public:
    explicit WebSocketInflater(int windowBits = 15);
    WEBCORE_EXPORT ~WebSocketInflater();

    bool initialize();
    bool addBytes(std::span<const uint8_t>);
    bool finish();
    size_t size() const { return m_buffer.size(); }
    std::span<const uint8_t> span() const { return m_buffer.span(); }
    void reset();

private:
    int m_windowBits;
    Vector<uint8_t> m_buffer;
    std::unique_ptr<z_stream> m_stream;
};

} // namespace WebCore
