/*
 * Copyright (C) 2024 Igalia S.L. All rights reserved.
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

#include "ExceptionOr.h"
#include "TrustedHTML.h"
#include "TrustedScript.h"
#include "TrustedScriptURL.h"

namespace JSC {

class ArgList;

enum class CompilationType;

} // namespace JSC

namespace WebCore {

class Exception;
class ScriptExecutionContext;

enum class TrustedType : int8_t {
    TrustedHTML,
    TrustedScript,
    TrustedScriptURL,
};

struct AttributeTypeAndSink {
    String attributeType;
    String sink;
};

ASCIILiteral trustedTypeToString(TrustedType);
TrustedType stringToTrustedType(String);
ASCIILiteral trustedTypeToCallbackName(TrustedType);

WEBCORE_EXPORT std::variant<std::monostate, Exception, Ref<TrustedHTML>, Ref<TrustedScript>, Ref<TrustedScriptURL>> processValueWithDefaultPolicy(ScriptExecutionContext&, TrustedType, const String& input, const String& sink);

WEBCORE_EXPORT ExceptionOr<String> trustedTypeCompliantString(TrustedType, ScriptExecutionContext&, const String& input, const String& sink);

WEBCORE_EXPORT ExceptionOr<String> requireTrustedTypesForPreNavigationCheckPasses(ScriptExecutionContext&, const String& urlString);

ExceptionOr<String> trustedTypeCompliantString(ScriptExecutionContext&, std::variant<RefPtr<TrustedHTML>, String>&&, const String& sink);

ExceptionOr<String> trustedTypeCompliantString(ScriptExecutionContext&, std::variant<RefPtr<TrustedScript>, String>&&, const String& sink);

ExceptionOr<String> trustedTypeCompliantString(ScriptExecutionContext&, std::variant<RefPtr<TrustedScriptURL>, String>&&, const String& sink);

WEBCORE_EXPORT AttributeTypeAndSink trustedTypeForAttribute(const String& elementName, const String& attributeName, const String& elementNamespace, const String& attributeNamespace);

ExceptionOr<bool> canCompile(ScriptExecutionContext&, JSC::CompilationType, String codeString, const JSC::ArgList& args);

} // namespace WebCore
