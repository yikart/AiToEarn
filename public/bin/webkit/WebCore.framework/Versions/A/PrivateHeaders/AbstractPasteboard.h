/*
 * Copyright (C) 2017 Apple Inc. All rights reserved.
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

#if TARGET_OS_IPHONE

NS_ASSUME_NONNULL_BEGIN

@class WebItemProviderRegistrationInfoList;

@protocol AbstractPasteboard <NSObject>
@required

@property (readonly, nonatomic) NSInteger numberOfItems;
@property (nonatomic, copy, nullable) NSArray<__kindof NSItemProvider *> *itemProviders;

- (NSArray<NSString *> *)pasteboardTypes;
- (NSData *)dataForPasteboardType:(NSString *)pasteboardType;
- (NSArray *)dataForPasteboardType:(NSString *)pasteboardType inItemSet:(NSIndexSet *)itemSet;
- (NSArray *)valuesForPasteboardType:(NSString *)pasteboardType inItemSet:(NSIndexSet *)itemSet;
- (NSInteger)changeCount;

@optional
- (void)stageRegistrationLists:(NSArray<WebItemProviderRegistrationInfoList *> *)infoLists;
- (void)clearRegistrationLists;
- (NSArray<WebItemProviderRegistrationInfoList *> *)takeRegistrationLists;
- (void)setItems:(NSArray<NSDictionary *> *)items;
@property (readonly, nonatomic) NSInteger numberOfFiles;
@property (readonly, nonatomic) NSArray<NSURL *> *allDroppedFileURLs;

// Computes lists of file URLs and types. Each file URL and type corresponds to a representation of the item provider at the given index.
// In order from highest fidelity to lowest fidelity.
- (NSArray<NSURL *> *)fileUploadURLsAtIndex:(NSUInteger)index fileTypes:(NSArray<NSString *> *_Nullable *_Nonnull)outFileTypes;
- (void)updateSupportedTypeIdentifiers:(NSArray<NSString *> *)types;

@end

NS_ASSUME_NONNULL_END

#endif // TARGET_OS_IPHONE
