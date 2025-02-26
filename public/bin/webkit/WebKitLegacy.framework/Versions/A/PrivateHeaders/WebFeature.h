/*
 * Copyright (C) 2020-2023 Apple Inc. All rights reserved.
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

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/*!
 @enum WebFeatureStatus
 @abstract Field indicating the purpose and level of completeness of a web feature. Used to determine which UI (if any) should reveal a feature.
 */
typedef NS_ENUM(NSUInteger, WebFeatureStatus) {
    /// For customizing WebKit behavior in embedding applications.
    WebFeatureStatusEmbedder,
    /// Feature in active development. Unfinished, no promise it is usable or safe.
    WebFeatureStatusUnstable,
    /// Tools for debugging the WebKit engine. Not generally useful to web developers.
    WebFeatureStatusInternal,
    /// Tools for web developers.
    WebFeatureStatusDeveloper,
    /// Enabled by default in test infrastructure, but not ready to ship yet.
    WebFeatureStatusTestable,
    /// Enabled by default in Safari Technology Preview, but not considered ready to ship yet.
    WebFeatureStatusPreview,
    /// Enabled by default and ready for general use.
    WebFeatureStatusStable,
    /// Enabled by default and in general use for more than a year.
    WebFeatureStatusMature
};

/*!
 @enum WebFeatureCategory
 @abstract Field indicating the category of a web feature. Used to determine how a feature should be sorted or grouped in the UI.
 */
typedef NS_ENUM(NSUInteger, WebFeatureCategory) {
    WebFeatureCategoryNone = 0,
    WebFeatureCategoryAnimation = 1,
    WebFeatureCategoryCSS = 2,
    WebFeatureCategoryDOM = 3,
    WebFeatureCategoryJavascript = 4,
    WebFeatureCategoryMedia = 5,
    WebFeatureCategoryNetworking = 6,
    WebFeatureCategoryPrivacy = 7,
    WebFeatureCategorySecurity = 8,
    WebFeatureCategoryHTML = 9,
    WebFeatureCategoryExtensions = 10,
};

@interface WebFeature : NSObject

@property (nonatomic, readonly, copy) NSString *key;
@property (nonatomic, readonly, copy) NSString *preferenceKey;
@property (nonatomic, readonly, copy) NSString *name;
@property (nonatomic, readonly) WebFeatureStatus status;
@property (nonatomic, readonly) WebFeatureCategory category;
@property (nonatomic, readonly, copy) NSString *details;
@property (nonatomic, readonly) BOOL defaultValue;
@property (nonatomic, readonly, getter=isHidden) BOOL hidden;

@end

NS_ASSUME_NONNULL_END
