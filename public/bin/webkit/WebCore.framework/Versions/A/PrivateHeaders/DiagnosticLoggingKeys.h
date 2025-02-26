/*
 * Copyright (C) 2012-2018 Apple Inc. All rights reserved.
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

#include <wtf/text/WTFString.h>

namespace WebCore {

enum class HTMLMediaElementSourceType : uint8_t;

class DiagnosticLoggingKeys {
public:
    static String applicationCacheKey();
#if ENABLE(APPLICATION_MANIFEST)
    static String applicationManifestKey();
#endif
    static String audioKey();
    WEBCORE_EXPORT static String backNavigationDeltaKey();
    WEBCORE_EXPORT static String cacheControlNoStoreKey();
    static String cachedResourceRevalidationKey();
    static String cachedResourceRevalidationReasonKey();
    static String canCacheKey();
    WEBCORE_EXPORT static String canceledLessThan2SecondsKey();
    WEBCORE_EXPORT static String canceledLessThan5SecondsKey();
    WEBCORE_EXPORT static String canceledLessThan20SecondsKey();
    WEBCORE_EXPORT static String canceledMoreThan20SecondsKey();
    static String cannotSuspendActiveDOMObjectsKey();
    WEBCORE_EXPORT static String cpuUsageKey();
    WEBCORE_EXPORT static String createSharedBufferFailedKey();
    static String deniedByClientKey();
    static String deviceMotionKey();
    static String deviceOrientationKey();
    static String diskCacheKey();
    static String diskCacheAfterValidationKey();
    static String memoryCacheKey();
    static String memoryCacheAfterValidationKey();
    static String documentLoaderStoppingKey();
    WEBCORE_EXPORT static String domainCausingCrashKey();
    static String domainCausingEnergyDrainKey();
    WEBCORE_EXPORT static String domainCausingJetsamKey();
    WEBCORE_EXPORT static String simulatedPageCrashKey();
    WEBCORE_EXPORT static String exceededActiveMemoryLimitKey();
    WEBCORE_EXPORT static String exceededInactiveMemoryLimitKey();
    WEBCORE_EXPORT static String exceededBackgroundCPULimitKey();
    static String domainVisitedKey();
    static String engineFailedToLoadKey();
    WEBCORE_EXPORT static String entryRightlyNotWarmedUpKey();
    WEBCORE_EXPORT static String entryWronglyNotWarmedUpKey();
    static String expiredKey();
    WEBCORE_EXPORT static String failedLessThan2SecondsKey();
    WEBCORE_EXPORT static String failedLessThan5SecondsKey();
    WEBCORE_EXPORT static String failedLessThan20SecondsKey();
    WEBCORE_EXPORT static String failedMoreThan20SecondsKey();
    static String fontKey();
    static String httpsNoStoreKey();
    static String imageKey();
    WEBCORE_EXPORT static String internalErrorKey();
    WEBCORE_EXPORT static String invalidSessionIDKey();
    WEBCORE_EXPORT static String isAttachmentKey();
    WEBCORE_EXPORT static String isConditionalRequestKey();
    static String isDisabledKey();
    static String isErrorPageKey();
    WEBCORE_EXPORT static String isReloadIgnoringCacheDataKey();
    static String loadingKey();
    static String isLoadingKey();
    static String mainResourceKey();
    static String mediaLoadedKey();
    static String mediaLoadingFailedKey();
    static String memoryCacheEntryDecisionKey();
    static String memoryCacheUsageKey();
    WEBCORE_EXPORT static String missingValidatorFieldsKey();
    static String navigationKey();
    WEBCORE_EXPORT static String needsRevalidationKey();
    WEBCORE_EXPORT static String networkCacheKey();
    WEBCORE_EXPORT static String networkCacheFailureReasonKey();
    WEBCORE_EXPORT static String networkCacheUnusedReasonKey();
    WEBCORE_EXPORT static String networkCacheReuseFailureKey();
    static String networkKey();
    WEBCORE_EXPORT static String networkProcessCrashedKey();
    WEBCORE_EXPORT static String neverSeenBeforeKey();
    static String noKey();
    static String noCurrentHistoryItemKey();
    static String noDocumentLoaderKey();
    WEBCORE_EXPORT static String noLongerInCacheKey();
    WEBCORE_EXPORT static String nonVisibleStateKey();
    WEBCORE_EXPORT static String notHTTPFamilyKey();
    WEBCORE_EXPORT static String occurredKey();
    WEBCORE_EXPORT static String otherKey();
    static String backForwardCacheKey();
    static String backForwardCacheFailureKey();
    static String visuallyEmptyKey();
    static String pageContainsAtLeastOneMediaEngineKey();
    static String pageContainsMediaEngineKey();
    static String pageLoadedKey();
    static String playedKey();
    static String postPageBackgroundingCPUUsageKey();
    static String postPageBackgroundingMemoryUsageKey();
    static String postPageLoadCPUUsageKey();
    static String postPageLoadMemoryUsageKey();
    static String provisionalLoadKey();
    static String prunedDueToMaxSizeReached();
    static String prunedDueToMemoryPressureKey();
    static String prunedDueToProcessSuspended();
    static String quirkRedirectComingKey();
    static String rawKey();
    static String redirectKey();
    static String reloadFromOriginKey();
    static String reloadKey();
    static String reloadRevalidatingExpiredKey();
    static String replaceKey();
    static String resourceLoadedKey();
    static String resourceResponseSourceKey();
    WEBCORE_EXPORT static String retrievalKey();
    WEBCORE_EXPORT static String retrievalRequestKey();
    static String sameLoadKey();
    static String scriptKey();
    static String serviceWorkerKey();
    static String siteSpecificQuirkKey();
    WEBCORE_EXPORT static String streamingMedia();
    static String styleSheetKey();
    WEBCORE_EXPORT static String succeededLessThan2SecondsKey();
    WEBCORE_EXPORT static String succeededLessThan5SecondsKey();
    WEBCORE_EXPORT static String succeededLessThan20SecondsKey();
    WEBCORE_EXPORT static String succeededMoreThan20SecondsKey();
    WEBCORE_EXPORT static String successfulSpeculativeWarmupWithRevalidationKey();
    WEBCORE_EXPORT static String successfulSpeculativeWarmupWithoutRevalidationKey();
    static String svgDocumentKey();
    WEBCORE_EXPORT static String synchronousMessageFailedKey();
    WEBCORE_EXPORT static String telemetryPageLoadKey();
    WEBCORE_EXPORT static String timedOutKey();
    WEBCORE_EXPORT static String uncacheableStatusCodeKey();
    static String underMemoryPressureKey();
    WEBCORE_EXPORT static String unknownEntryRequestKey();
    WEBCORE_EXPORT static String unlikelyToReuseKey();
    WEBCORE_EXPORT static String unsupportedHTTPMethodKey();
    static String unsuspendableDOMObjectKey();
    WEBCORE_EXPORT static String unusedKey();
    static String usedKey();
    WEBCORE_EXPORT static String userZoomActionKey();
    WEBCORE_EXPORT static String varyingHeaderMismatchKey();
    static String videoKey();
    WEBCORE_EXPORT static String visibleNonActiveStateKey();
    WEBCORE_EXPORT static String visibleAndActiveStateKey();
    WEBCORE_EXPORT static String wastedSpeculativeWarmupWithRevalidationKey();
    WEBCORE_EXPORT static String wastedSpeculativeWarmupWithoutRevalidationKey();
    WEBCORE_EXPORT static String webViewKey();
    static String yesKey();

    static String mediaSourceTypeWatchTimeKey();
    static String mediaVideoCodecWatchTimeKey();
    static String mediaAudioCodecWatchTimeKey();
    static String mediaBufferingWatchTimeKey();

    static String secondsKey();
    static String sourceTypeKey();
    static String videoCodecKey();
    static String audioCodecKey();
    static String textTrackTypeKey();
    static String textTrackKindKey();
    static String textTrackModeKey();

    WEBCORE_EXPORT static String memoryUsageToDiagnosticLoggingKey(uint64_t memoryUsage);
    WEBCORE_EXPORT static String foregroundCPUUsageToDiagnosticLoggingKey(double cpuUsage);
    WEBCORE_EXPORT static String backgroundCPUUsageToDiagnosticLoggingKey(double cpuUsage);
};

} // namespace WebCore
