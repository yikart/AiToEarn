/*
 * Copyright (C) 2022-2024 Apple Inc. All rights reserved.
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

#import <WebKit/WKWebExtensionControllerConfiguration.h>

WK_HEADER_AUDIT_BEGIN(nullability, sendability)

@interface WKWebExtensionControllerConfiguration ()

/*!
 @abstract Returns a new configuration that is persistent and uses a temporary directory.
 @discussion This method creates a configuration for a ``WKWebExtensionController`` that is persistent during the session
 and uses a temporary directory for storage. This is ideal for scenarios that require temporary data persistence, such as testing.
 Each instance is created with a unique temporary directory.
*/
+ (instancetype)_temporaryConfiguration;

/*!
 @abstract A Boolean value indicating if this configuration uses a temporary directory.
 @discussion Indicates whether the configuration is persistent, with data stored in a temporary directory.
*/
@property (nonatomic, readonly, getter=_isTemporary) BOOL _temporary;

/*!
 @abstract The file path to the storage directory, if applicable.
 @discussion Provides the file path to the storage directory used by the configuration. It is `nil` for non-persistent
 configurations. For persistent configurations, it provides the path where data is stored, which may be a temporary directory.
*/
@property (nonatomic, nullable, copy, setter=_setStorageDirectoryPath:) NSString *_storageDirectoryPath;

@end

WK_HEADER_AUDIT_END(nullability, sendability)
