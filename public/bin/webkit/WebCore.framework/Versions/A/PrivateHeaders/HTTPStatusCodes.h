/*
 * Copyright (C) 2024 Apple Inc. All rights reserved.
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

namespace WebCore {

// https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml

constexpr auto httpStatus103EarlyHints = 103;

constexpr auto httpStatus200OK = 200;
constexpr auto httpStatus204NoContent = 204;
constexpr auto httpStatus206PartialContent = 206;

constexpr auto httpStatus300MultipleChoices = 300;
constexpr auto httpStatus301MovedPermanently = 301;
constexpr auto httpStatus302Found = 302;
constexpr auto httpStatus303SeeOther = 303;
constexpr auto httpStatus304NotModified = 304;
constexpr auto httpStatus307TemporaryRedirect = 307;
constexpr auto httpStatus308PermanentRedirect = 308;

constexpr auto httpStatus400BadRequest = 400;
constexpr auto httpStatus401Unauthorized = 401;
constexpr auto httpStatus403Forbidden = 403;
constexpr auto httpStatus407ProxyAuthenticationRequired = 407;
constexpr auto httpStatus416RangeNotSatisfiable = 416;

} // namespace WebCore

using WebCore::httpStatus103EarlyHints;

using WebCore::httpStatus200OK;
using WebCore::httpStatus204NoContent;
using WebCore::httpStatus206PartialContent;

using WebCore::httpStatus300MultipleChoices;
using WebCore::httpStatus301MovedPermanently;
using WebCore::httpStatus302Found;
using WebCore::httpStatus303SeeOther;
using WebCore::httpStatus304NotModified;
using WebCore::httpStatus307TemporaryRedirect;
using WebCore::httpStatus308PermanentRedirect;

using WebCore::httpStatus400BadRequest;
using WebCore::httpStatus401Unauthorized;
using WebCore::httpStatus403Forbidden;
using WebCore::httpStatus407ProxyAuthenticationRequired;
using WebCore::httpStatus416RangeNotSatisfiable;
