/*
 * Copyright (C) 2015 Apple Inc. All rights reserved.
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

#if ENABLE(CONTENT_EXTENSIONS)

#include <system_error>

#include <wtf/Forward.h>

namespace WebCore {
namespace ContentExtensions {

enum class ContentExtensionError {
    // JSON parser error
    JSONInvalid = 1,
    
    // JSON semantics error
    JSONTopLevelStructureNotAnArray,
    JSONInvalidObjectInTopLevelArray,
    JSONInvalidRule,
    JSONContainsNoRules,
    
    JSONInvalidTrigger,
    JSONInvalidURLFilterInTrigger,
    JSONInvalidTriggerFlagsArray,
    JSONInvalidStringInTriggerFlagsArray,
    JSONInvalidConditionList,
    JSONDomainNotLowerCaseASCII,
    JSONMultipleConditions,
    JSONTooManyRules,
    
    JSONInvalidAction,
    JSONInvalidActionType,
    JSONInvalidCSSDisplayNoneActionType,
    JSONInvalidNotification,
    JSONInvalidRegex,

    JSONRedirectMissing,
    JSONRedirectExtensionPathDoesNotStartWithSlash,
    JSONRedirectURLSchemeInvalid,
    JSONRedirectToJavaScriptURL,
    JSONRedirectURLInvalid,
    JSONRedirectInvalidType,
    JSONRedirectInvalidPort,
    JSONRedirectInvalidQuery,
    JSONRedirectInvalidFragment,

    JSONRemoveParametersNotStringArray,

    JSONAddOrReplaceParametersNotArray,
    JSONAddOrReplaceParametersKeyValueNotADictionary,
    JSONAddOrReplaceParametersKeyValueMissingKeyString,
    JSONAddOrReplaceParametersKeyValueMissingValueString,

    JSONModifyHeadersNotArray,
    JSONModifyHeadersInfoNotADictionary,
    JSONModifyHeadersMissingOperation,
    JSONModifyHeadersInvalidOperation,
    JSONModifyHeadersMissingHeader,
    JSONModifyHeadersMissingValue,
    JSONModifyHeadersInvalidPriority,

    ErrorWritingSerializedNFA,
};

extern ASCIILiteral WebKitContentBlockerDomain;
    
WEBCORE_EXPORT const std::error_category& contentExtensionErrorCategory();

inline std::error_code make_error_code(ContentExtensionError error)
{
    return { static_cast<int>(error), contentExtensionErrorCategory() };
}

} // namespace ContentExtensions
} // namespace WebCore

namespace std {
    template<> struct is_error_code_enum<WebCore::ContentExtensions::ContentExtensionError> : public true_type { };
}

#endif // ENABLE(CONTENT_EXTENSIONS)
