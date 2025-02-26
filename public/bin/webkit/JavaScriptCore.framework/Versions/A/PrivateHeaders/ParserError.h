/*
 * Copyright (C) 2013 Apple Inc. All Rights Reserved.
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

#include "Error.h"
#include "ErrorHandlingScope.h"
#include "ExceptionHelpers.h"
#include "JSGlobalObject.h"
#include "ParserTokens.h"
#include "SourceCode.h"
#include <wtf/text/WTFString.h>

namespace JSC {

class ParserError {
public:
    enum SyntaxErrorType : uint8_t {
        SyntaxErrorNone,
        SyntaxErrorIrrecoverable,
        SyntaxErrorUnterminatedLiteral,
        SyntaxErrorRecoverable
    };

    enum ErrorType : uint8_t {
        ErrorNone,
        StackOverflow,
        EvalError,
        OutOfMemory,
        SyntaxError
    };

    ParserError()
        : m_type(ErrorNone)
        , m_syntaxErrorType(SyntaxErrorNone)
    {
    }
    
    explicit ParserError(ErrorType type)
        : m_type(type)
        , m_syntaxErrorType(SyntaxErrorNone)
    {
    }

    ParserError(ErrorType type, SyntaxErrorType syntaxError, JSToken token)
        : m_token(token)
        , m_type(type)
        , m_syntaxErrorType(syntaxError)
    {
    }

    ParserError(ErrorType type, SyntaxErrorType syntaxError, JSToken token, const String& msg, int line)
        : m_token(token)
        , m_message(msg)
        , m_line(line)
        , m_type(type)
        , m_syntaxErrorType(syntaxError)
    {
    }

    bool isValid() const { return m_type != ErrorNone; }
    SyntaxErrorType syntaxErrorType() const { return m_syntaxErrorType; }
    const JSToken& token() const { return m_token; }
    const String& message() const { return m_message; }
    int line() const { return m_line; }
    ErrorType type() const { return m_type; }

    JSObject* toErrorObject(
        JSGlobalObject* globalObject,
        SourceCode source, // Note: We must copy the source here, since the objects that pass in their SourceCode field may be destroyed in addErrorInfo.
        int overrideLineNumber = -1)
    {
        switch (m_type) {
        case ErrorNone:
            return nullptr;
        case SyntaxError:
            return addErrorInfo(
                globalObject->vm(), 
                createSyntaxError(globalObject, m_message), 
                overrideLineNumber == -1 ? m_line : overrideLineNumber, source);
        case EvalError:
            return createSyntaxError(globalObject, m_message);
        case StackOverflow: {
            ErrorHandlingScope errorScope(getVM(globalObject));
            return createStackOverflowError(globalObject);
        }
        case OutOfMemory:
            return createOutOfMemoryError(globalObject);
        }
        CRASH();
        return nullptr;
    }

private:
    JSToken m_token;
    String m_message;
    int m_line { -1 };
    ErrorType m_type;
    SyntaxErrorType m_syntaxErrorType;
};

} // namespace JSC

namespace WTF {

inline void printInternal(PrintStream& out, JSC::ParserError::SyntaxErrorType type)
{
    switch (type) {
    case JSC::ParserError::SyntaxErrorNone:
        out.print("SyntaxErrorNone");
        return;
    case JSC::ParserError::SyntaxErrorIrrecoverable:
        out.print("SyntaxErrorIrrecoverable");
        return;
    case JSC::ParserError::SyntaxErrorUnterminatedLiteral:
        out.print("SyntaxErrorUnterminatedLiteral");
        return;
    case JSC::ParserError::SyntaxErrorRecoverable:
        out.print("SyntaxErrorRecoverable");
        return;
    }
    
    RELEASE_ASSERT_NOT_REACHED();
}

inline void printInternal(PrintStream& out, JSC::ParserError::ErrorType type)
{
    switch (type) {
    case JSC::ParserError::ErrorNone:
        out.print("ErrorNone");
        return;
    case JSC::ParserError::StackOverflow:
        out.print("StackOverflow");
        return;
    case JSC::ParserError::EvalError:
        out.print("EvalError");
        return;
    case JSC::ParserError::OutOfMemory:
        out.print("OutOfMemory");
        return;
    case JSC::ParserError::SyntaxError:
        out.print("SyntaxError");
        return;
    }
    
    RELEASE_ASSERT_NOT_REACHED();
}

} // namespace WTF
