/*
 * Copyright (C) 2014-2018 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE COMPUTER, INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE COMPUTER, INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "ContentSecurityPolicy.h"
#include "FrameIdentifier.h"
#include "PageIdentifier.h"
#include "ShouldRelaxThirdPartyCookieBlocking.h"
#include <pal/SessionID.h>
#include <wtf/CompletionHandler.h>
#include <wtf/Forward.h>
#include <wtf/HashSet.h>
#include <wtf/Noncopyable.h>
#include <wtf/RefPtr.h>
#include <wtf/RobinHoodHashSet.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/UniqueRef.h>
#include <wtf/Vector.h>

#if ENABLE(APPLICATION_MANIFEST)
#include "ApplicationManifest.h"
#endif

#if PLATFORM(IOS_FAMILY) && ENABLE(DEVICE_ORIENTATION)
#include "DeviceOrientationUpdateProvider.h"
#endif

#if PLATFORM(VISION) && ENABLE(GAMEPAD)
#include "ShouldRequireExplicitConsentForGamepadAccess.h"
#endif

namespace WebCore {

class AlternativeTextClient;
class ApplicationCacheStorage;
class AttachmentElementClient;
class AuthenticatorCoordinatorClient;
class BackForwardClient;
class BadgeClient;
class BroadcastChannelRegistry;
class CacheStorageProvider;
class ChromeClient;
class ContextMenuClient;
class CookieJar;
class CredentialRequestCoordinatorClient;
class CryptoClient;
class DatabaseProvider;
class DiagnosticLoggingClient;
class DragClient;
class EditorClient;
class Frame;
class FrameLoader;
class HistoryItemClient;
class InspectorClient;
class LocalFrameLoaderClient;
class ModelPlayerProvider;
class PaymentCoordinatorClient;
class PerformanceLoggingClient;
class PluginInfoProvider;
class ProcessSyncClient;
class ProgressTrackerClient;
class RemoteFrame;
class RemoteFrameClient;
class ScreenOrientationManager;
class SocketProvider;
class SpeechRecognitionProvider;
class SpeechSynthesisClient;
class StorageNamespaceProvider;
class StorageProvider;
class UserContentProvider;
class UserContentURLPattern;
class ValidationMessageClient;
class VisitedLinkStore;
class WebRTCProvider;

enum class SandboxFlag : uint16_t;
using SandboxFlags = OptionSet<SandboxFlag>;

class PageConfiguration {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(PageConfiguration, WEBCORE_EXPORT);
    WTF_MAKE_NONCOPYABLE(PageConfiguration);
public:

    struct LocalMainFrameCreationParameters {
        CompletionHandler<UniqueRef<LocalFrameLoaderClient>(LocalFrame&, FrameLoader&)> clientCreator;
        SandboxFlags effectiveSandboxFlags;
    };
    using MainFrameCreationParameters = std::variant<LocalMainFrameCreationParameters, CompletionHandler<UniqueRef<RemoteFrameClient>(RemoteFrame&)>>;

    WEBCORE_EXPORT PageConfiguration(
        std::optional<PageIdentifier>,
        PAL::SessionID,
        UniqueRef<EditorClient>&&,
        Ref<SocketProvider>&&,
        UniqueRef<WebRTCProvider>&&,
        Ref<CacheStorageProvider>&&,
        Ref<UserContentProvider>&&,
        Ref<BackForwardClient>&&,
        Ref<CookieJar>&&,
        UniqueRef<ProgressTrackerClient>&&,
        MainFrameCreationParameters&&,
        FrameIdentifier mainFrameIdentifier,
        RefPtr<Frame>&& mainFrameOpener,
        UniqueRef<SpeechRecognitionProvider>&&,
        Ref<BroadcastChannelRegistry>&&,
        UniqueRef<StorageProvider>&&,
        UniqueRef<ModelPlayerProvider>&&,
        Ref<BadgeClient>&&,
        Ref<HistoryItemClient>&&,
#if ENABLE(CONTEXT_MENUS)
        UniqueRef<ContextMenuClient>&&,
#endif
#if ENABLE(APPLE_PAY)
        Ref<PaymentCoordinatorClient>&&,
#endif
        UniqueRef<ChromeClient>&&,
        UniqueRef<CryptoClient>&&,
        UniqueRef<ProcessSyncClient>&&
    );
    WEBCORE_EXPORT ~PageConfiguration();
    PageConfiguration(PageConfiguration&&);

    std::optional<PageIdentifier> identifier;
    PAL::SessionID sessionID;
    std::unique_ptr<AlternativeTextClient> alternativeTextClient;
    UniqueRef<ChromeClient> chromeClient;
#if ENABLE(CONTEXT_MENUS)
    UniqueRef<ContextMenuClient> contextMenuClient;
#endif
    UniqueRef<EditorClient> editorClient;
    Ref<SocketProvider> socketProvider;
    std::unique_ptr<DragClient> dragClient;
    std::unique_ptr<InspectorClient> inspectorClient;
#if ENABLE(APPLE_PAY)
    Ref<PaymentCoordinatorClient> paymentCoordinatorClient;
#endif

#if ENABLE(WEB_AUTHN)
    std::unique_ptr<AuthenticatorCoordinatorClient> authenticatorCoordinatorClient;
    std::unique_ptr<CredentialRequestCoordinatorClient> credentialRequestCoordinatorClient;
#endif

#if ENABLE(APPLICATION_MANIFEST)
    std::optional<ApplicationManifest> applicationManifest;
#endif

    UniqueRef<WebRTCProvider> webRTCProvider;

    UniqueRef<ProgressTrackerClient> progressTrackerClient;
    Ref<BackForwardClient> backForwardClient;
    Ref<CookieJar> cookieJar;
    std::unique_ptr<ValidationMessageClient> validationMessageClient;

    MainFrameCreationParameters mainFrameCreationParameters;

    FrameIdentifier mainFrameIdentifier;
    RefPtr<Frame> mainFrameOpener;
    std::unique_ptr<DiagnosticLoggingClient> diagnosticLoggingClient;
    std::unique_ptr<PerformanceLoggingClient> performanceLoggingClient;
#if ENABLE(SPEECH_SYNTHESIS)
    RefPtr<SpeechSynthesisClient> speechSynthesisClient;
#endif

    RefPtr<ApplicationCacheStorage> applicationCacheStorage;
    RefPtr<DatabaseProvider> databaseProvider;
    Ref<CacheStorageProvider> cacheStorageProvider;
    RefPtr<PluginInfoProvider> pluginInfoProvider;
    RefPtr<StorageNamespaceProvider> storageNamespaceProvider;
    Ref<UserContentProvider> userContentProvider;
    RefPtr<VisitedLinkStore> visitedLinkStore;
    Ref<BroadcastChannelRegistry> broadcastChannelRegistry;
    WeakPtr<ScreenOrientationManager> screenOrientationManager;

#if ENABLE(DEVICE_ORIENTATION) && PLATFORM(IOS_FAMILY)
    RefPtr<DeviceOrientationUpdateProvider> deviceOrientationUpdateProvider;
#endif
    Vector<UserContentURLPattern> corsDisablingPatterns;
    HashSet<String> maskedURLSchemes;
    UniqueRef<SpeechRecognitionProvider> speechRecognitionProvider;

    // FIXME: These should be all be Settings.
    bool loadsSubresources { true };
    std::optional<MemoryCompactLookupOnlyRobinHoodHashSet<String>> allowedNetworkHosts;
    bool userScriptsShouldWaitUntilNotification { true };
    ShouldRelaxThirdPartyCookieBlocking shouldRelaxThirdPartyCookieBlocking { ShouldRelaxThirdPartyCookieBlocking::No };
    bool httpsUpgradeEnabled { true };
    std::optional<std::pair<uint16_t, uint16_t>> portsForUpgradingInsecureSchemeForTesting;

#if PLATFORM(IOS_FAMILY)
    bool canShowWhileLocked { false };
#endif

    UniqueRef<StorageProvider> storageProvider;

    UniqueRef<ModelPlayerProvider> modelPlayerProvider;
#if ENABLE(ATTACHMENT_ELEMENT)
    std::unique_ptr<AttachmentElementClient> attachmentElementClient;
#endif

    Ref<BadgeClient> badgeClient;
    Ref<HistoryItemClient> historyItemClient;

    ContentSecurityPolicyModeForExtension contentSecurityPolicyModeForExtension { WebCore::ContentSecurityPolicyModeForExtension::None };
    UniqueRef<CryptoClient> cryptoClient;

    UniqueRef<ProcessSyncClient> processSyncClient;

#if PLATFORM(VISION) && ENABLE(GAMEPAD)
    ShouldRequireExplicitConsentForGamepadAccess gamepadAccessRequiresExplicitConsent { ShouldRequireExplicitConsentForGamepadAccess::No };
#endif

#if HAVE(AUDIT_TOKEN)
    std::optional<audit_token_t> presentingApplicationAuditToken;
#endif
};

}
