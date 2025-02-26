/*
 * Copyright (C) 2004, 2008 Apple Inc. All rights reserved.
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

#include <wtf/Forward.h>
#include <wtf/text/ASCIILiteral.h>

namespace WebCore {

class Text;

constexpr auto AppleInterchangeNewline = "Apple-interchange-newline"_s;
constexpr auto AppleConvertedSpace = "Apple-converted-space"_s;
constexpr auto WebKitMSOListQuirksStyle = "WebKit-mso-list-quirks-style"_s;

constexpr auto ApplePasteAsQuotation = "Apple-paste-as-quotation"_s;
constexpr auto AppleStyleSpanClass = "Apple-style-span"_s;
constexpr auto AppleTabSpanClass = "Apple-tab-span"_s;

// Controls whether a special BR which is removed upon paste in ReplaceSelectionCommand needs to be inserted
// and making sequence of spaces not collapsible by inserting non-breaking spaces.
// See https://trac.webkit.org/r8087 and https://trac.webkit.org/r8096.
enum class AnnotateForInterchange : bool { No, Yes };

String convertHTMLTextToInterchangeFormat(const String&, const Text*);

} // namespace WebCore
