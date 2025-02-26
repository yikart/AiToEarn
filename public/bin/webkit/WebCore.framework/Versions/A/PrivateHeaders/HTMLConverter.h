/*
 * Copyright (C) 2010-2020 Apple Inc. All rights reserved.
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

#import "AttributedString.h"
#import "SimpleRange.h"

namespace WebCore {

enum class IgnoreUserSelectNone : bool;

WEBCORE_EXPORT AttributedString attributedString(const SimpleRange&, IgnoreUserSelectNone);

// This alternate implementation of HTML conversion doesn't handle as many advanced features,
// such as tables, and doesn't produce document attributes, but it does use TextIterator so
// text offsets will exactly match plain text and other editing machinery.
// FIXME: This function and the one above should be merged.

enum class IncludedElement : uint8_t {
    Images = 1 << 0,
    Attachments = 1 << 1,
    PreservedContent = 1 << 2,
    NonRenderedContent = 1 << 3,
};

WEBCORE_EXPORT AttributedString editingAttributedString(const SimpleRange&, OptionSet<IncludedElement> = { IncludedElement::Images });

} // namespace WebCore
