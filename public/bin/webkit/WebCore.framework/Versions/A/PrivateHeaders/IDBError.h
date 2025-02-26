/*
 * Copyright (C) 2015, 2016 Apple Inc. All rights reserved.
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

#include "DOMException.h"
#include "ExceptionCode.h"
#include <wtf/text/WTFString.h>

namespace WebCore {

class IDBError {
public:
    WEBCORE_EXPORT explicit IDBError(std::optional<ExceptionCode> = std::nullopt, const String& message = { });

    static IDBError userDeleteError()
    {
        return IDBError { ExceptionCode::UnknownError, "Database deleted by request of the user"_s };
    }
    
    static IDBError serverConnectionLostError()
    {
        return IDBError { ExceptionCode::UnknownError, "Connection to Indexed Database server lost. Refresh the page to try again"_s };
    }

    RefPtr<DOMException> toDOMException() const;

    std::optional<ExceptionCode> code() const { return m_code; }
    String name() const;
    String message() const;
    const String& messageForSerialization() const { return m_message; }

    bool isNull() const { return !m_code; }
    operator bool() const { return !isNull(); }

    IDBError isolatedCopy() const & { return IDBError { m_code, m_message.isolatedCopy() }; }
    IDBError isolatedCopy() && { return IDBError { m_code, WTFMove(m_message).isolatedCopy() }; }

private:
    std::optional<ExceptionCode> m_code;
    String m_message;
};

} // namespace WebCore
