/*
 * Copyright (C) 2019 Apple Inc. All rights reserved.
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

#include "ParserError.h"
#include <variant>

namespace JSC {

class BytecodeCacheError {
public:
    class StandardError {
    public:
        StandardError(int error)
            : m_errno(error)
        {
        }

        bool isValid() const;
        String message() const;

    private:
        int m_errno;
    };

    class WriteError {
    public:
        WriteError(size_t written, size_t expected)
            : m_written(written)
            , m_expected(expected)
        {
        }

        bool isValid() const;
        String message() const;

    private:
        size_t m_written;
        size_t m_expected;
    };

    JS_EXPORT_PRIVATE BytecodeCacheError& operator=(const ParserError&);
    JS_EXPORT_PRIVATE BytecodeCacheError& operator=(const StandardError&);
    JS_EXPORT_PRIVATE BytecodeCacheError& operator=(const WriteError&);

    JS_EXPORT_PRIVATE bool isValid() const;
    JS_EXPORT_PRIVATE String message() const;

private:
    std::variant<ParserError, StandardError, WriteError> m_error;
};

} // namespace JSC
