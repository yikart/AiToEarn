/*
 * Copyright (C) 2013-2020 Apple Inc. All rights reserved.
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

#import <Availability.h>
#import <TargetConditionals.h>

#ifdef __cplusplus
#define WK_EXTERN extern "C" __attribute__((visibility ("default")))
#else
#define WK_EXTERN extern __attribute__((visibility ("default")))
#endif

#ifdef NS_SWIFT_ASYNC_NAME
#define WK_SWIFT_ASYNC_NAME(...) NS_SWIFT_ASYNC_NAME(__VA_ARGS__)
#else
#define WK_SWIFT_ASYNC_NAME(...)
#endif

#ifdef NS_SWIFT_ASYNC
#define WK_SWIFT_ASYNC(...) NS_SWIFT_ASYNC(__VA_ARGS__)
#else
#define WK_SWIFT_ASYNC(...)
#endif

#ifdef NS_SWIFT_ASYNC_THROWS_ON_FALSE
#define WK_SWIFT_ASYNC_THROWS_ON_FALSE(...) NS_SWIFT_ASYNC_THROWS_ON_FALSE(__VA_ARGS__)
#else
#define WK_SWIFT_ASYNC_THROWS_ON_FALSE(...)
#endif

#if __has_attribute(swift_async_error)
#define WK_NULLABLE_RESULT _Nullable_result
#else
#define WK_NULLABLE_RESULT _Nullable
#endif

#ifdef NS_SWIFT_UI_ACTOR
#define WK_SWIFT_UI_ACTOR NS_SWIFT_UI_ACTOR
#else
#define WK_SWIFT_UI_ACTOR
#endif

#ifdef NS_HEADER_AUDIT_BEGIN
#define WK_HEADER_AUDIT_BEGIN NS_HEADER_AUDIT_BEGIN
#define WK_HEADER_AUDIT_END NS_HEADER_AUDIT_END
#else
#define WK_HEADER_AUDIT_BEGIN(...) NS_ASSUME_NONNULL_BEGIN
#define WK_HEADER_AUDIT_END(...) NS_ASSUME_NONNULL_END
#endif

#define WK_API_AVAILABLE(...)
#define WK_API_UNAVAILABLE(...)
#define WK_CLASS_AVAILABLE(...) __attribute__((visibility("default"))) WK_API_AVAILABLE(__VA_ARGS__)
#define WK_API_DEPRECATED(_message, ...) __attribute__((deprecated(_message)))
#define WK_API_DEPRECATED_WITH_REPLACEMENT(_replacement, ...) __attribute__((deprecated("use " #_replacement)))
#define WK_CLASS_DEPRECATED_WITH_REPLACEMENT(_replacement, ...) __attribute__((visibility("default"))) __attribute__((deprecated("use " #_replacement)))

