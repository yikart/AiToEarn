/*
 * Copyright (C) 2011 Google, Inc. All rights reserved.
 * Copyright (C) 2016-2022 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY GOOGLE INC. ``AS IS'' AND ANY
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

#include "ContentSecurityPolicyHash.h"
#include "ContentSecurityPolicyResponseHeaders.h"
#include "SecurityContext.h"
#include "SecurityOrigin.h"
#include "SecurityOriginHash.h"
#include <functional>
#include <wtf/CheckedPtr.h>
#include <wtf/HashSet.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/Vector.h>
#include <wtf/text/TextPosition.h>

namespace JSC {
class CallFrame;
class JSGlobalObject;
}

namespace PAL {
class TextEncoding;
}

namespace WTF {
class OrdinalNumber;
}

namespace WebCore {

class ContentSecurityPolicyDirective;
class ContentSecurityPolicyDirectiveList;
class ContentSecurityPolicySource;
class DOMStringList;
class Element;
class JSWindowProxy;
class LocalFrame;
class ResourceRequest;
class ScriptExecutionContext;
class SecurityOrigin;
struct ContentSecurityPolicyClient;
struct ReportingClient;

enum class ParserInserted : bool { No, Yes };
static constexpr unsigned bitWidthOfParserInserted = 1;
static_assert(static_cast<unsigned>(ParserInserted::Yes) <= ((1U << bitWidthOfParserInserted) - 1));

enum class LogToConsole : bool { No, Yes };
enum class CheckUnsafeHashes : bool { No, Yes };

typedef Vector<std::unique_ptr<ContentSecurityPolicyDirectiveList>> CSPDirectiveListVector;

enum class ContentSecurityPolicyModeForExtension : uint8_t {
    None,
    ManifestV2,
    ManifestV3
};

enum class AllowTrustedTypePolicy : uint8_t {
    Allowed,
    DisallowedName,
    DisallowedDuplicateName,
};

class ContentSecurityPolicy final : public CanMakeThreadSafeCheckedPtr<ContentSecurityPolicy> {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(ContentSecurityPolicy, WEBCORE_EXPORT);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(ContentSecurityPolicy);
public:
    explicit ContentSecurityPolicy(URL&&, ScriptExecutionContext&);
    WEBCORE_EXPORT explicit ContentSecurityPolicy(URL&&, ContentSecurityPolicyClient*, ReportingClient*);
    WEBCORE_EXPORT ~ContentSecurityPolicy();

    enum class ShouldMakeIsolatedCopy : bool { No, Yes };
    void copyStateFrom(const ContentSecurityPolicy*, ShouldMakeIsolatedCopy = ShouldMakeIsolatedCopy::No);
    void inheritHeadersFrom(const ContentSecurityPolicyResponseHeaders&);
    void copyUpgradeInsecureRequestStateFrom(const ContentSecurityPolicy&, ShouldMakeIsolatedCopy = ShouldMakeIsolatedCopy::No);
    void createPolicyForPluginDocumentFrom(const ContentSecurityPolicy&);

    void didCreateWindowProxy(JSWindowProxy&) const;

    enum class PolicyFrom {
        API,
        HTTPEquivMeta,
        HTTPHeader,
        Inherited,
        InheritedForPluginDocument,
    };
    WEBCORE_EXPORT ContentSecurityPolicyResponseHeaders responseHeaders() const;
    enum ReportParsingErrors : bool { No, Yes };
    WEBCORE_EXPORT void didReceiveHeaders(const ContentSecurityPolicyResponseHeaders&, String&& referrer, ReportParsingErrors = ReportParsingErrors::Yes);
    void didReceiveHeaders(const ContentSecurityPolicy&, ReportParsingErrors = ReportParsingErrors::Yes);
    void didReceiveHeader(const String&, ContentSecurityPolicyHeaderType, ContentSecurityPolicy::PolicyFrom, String&& referrer, int httpStatusCode = 0);

    bool allowScriptWithNonce(const String& nonce, bool overrideContentSecurityPolicy = false) const;
    bool allowStyleWithNonce(const String& nonce, bool overrideContentSecurityPolicy = false) const;

    bool allowJavaScriptURLs(const String& contextURL, const OrdinalNumber& contextLine, const String& code, Element*) const;
    bool allowInlineEventHandlers(const String& contextURL, const OrdinalNumber& contextLine, const String& code, Element*, bool overrideContentSecurityPolicy = false) const;
    bool allowInlineScript(const String& contextURL, const OrdinalNumber& contextLine, StringView scriptContent, Element&, const String& nonce, bool overrideContentSecurityPolicy = false) const;
    bool allowNonParserInsertedScripts(const URL& sourceURL, const URL& contextURL, const OrdinalNumber&, const String& nonce, const String& subResourceIntegrity, const StringView&, ParserInserted) const;
    bool allowInlineStyle(const String& contextURL, const OrdinalNumber& contextLine, StringView styleContent, CheckUnsafeHashes, Element&, const String&, bool overrideContentSecurityPolicy = false) const;

    bool allowEval(JSC::JSGlobalObject*, LogToConsole, StringView codeContent, bool overrideContentSecurityPolicy = false) const;

    bool allowPluginType(const String& type, const String& typeAttribute, const URL&, bool overrideContentSecurityPolicy = false) const;

    bool allowFrameAncestors(const LocalFrame&, const URL&, bool overrideContentSecurityPolicy = false) const;
    WEBCORE_EXPORT bool allowFrameAncestors(const Vector<Ref<SecurityOrigin>>& ancestorOrigins, const URL&, bool overrideContentSecurityPolicy = false) const;
    WEBCORE_EXPORT bool overridesXFrameOptions() const;

    enum class RedirectResponseReceived : bool { No, Yes };
    WEBCORE_EXPORT bool allowScriptFromSource(const URL&, RedirectResponseReceived = RedirectResponseReceived::No, const URL& preRedirectURL = URL(), const String& = nullString(), const String& nonce = nullString()) const;
    WEBCORE_EXPORT bool allowWorkerFromSource(const URL&, RedirectResponseReceived = RedirectResponseReceived::No, const URL& preRedirectURL = URL()) const;
    bool allowImageFromSource(const URL&, RedirectResponseReceived = RedirectResponseReceived::No, const URL& preRedirectURL = URL()) const;
    bool allowPrefetchFromSource(const URL&, RedirectResponseReceived = RedirectResponseReceived::No, const URL& preRedirectURL = URL()) const;
    bool allowStyleFromSource(const URL&, RedirectResponseReceived = RedirectResponseReceived::No, const URL& preRedirectURL = URL(), const String& nonce = nullString()) const;
    bool allowFontFromSource(const URL&, RedirectResponseReceived = RedirectResponseReceived::No, const URL& preRedirectURL = URL()) const;
#if ENABLE(APPLICATION_MANIFEST)
    bool allowManifestFromSource(const URL&, RedirectResponseReceived = RedirectResponseReceived::No, const URL& preRedirectURL = URL()) const;
#endif
    bool allowMediaFromSource(const URL&, RedirectResponseReceived = RedirectResponseReceived::No, const URL& preRedirectURL = URL()) const;

    bool allowChildFrameFromSource(const URL&, RedirectResponseReceived = RedirectResponseReceived::No) const;
    WEBCORE_EXPORT bool allowConnectToSource(const URL&, RedirectResponseReceived = RedirectResponseReceived::No, const URL& requestedURL = URL()) const;
    bool allowFormAction(const URL&, RedirectResponseReceived = RedirectResponseReceived::No, const URL& preRedirectURL = URL()) const;

    bool allowObjectFromSource(const URL&, RedirectResponseReceived = RedirectResponseReceived::No, const URL& preRedirectURL = URL()) const;
    bool allowBaseURI(const URL&, bool overrideContentSecurityPolicy = false) const;

    AllowTrustedTypePolicy allowTrustedTypesPolicy(const String&, bool isDuplicate) const;
    bool requireTrustedTypesForSinkGroup(const String& sinkGroup) const;
    bool allowMissingTrustedTypesForSinkGroup(const String& stringContext, const String& sink, const String& sinkGroup, StringView source) const;

    void setOverrideAllowInlineStyle(bool);

    void gatherReportURIs(DOMStringList&) const;

    bool allowRunningOrDisplayingInsecureContent(const URL&);

    // The following functions are used by internal data structures to call back into this object when parsing, validating,
    // and applying a Content Security Policy.
    // FIXME: We should make the various directives serve only as state stores for the parsed policy and remove these functions.
    // This class should traverse the directives, validating the policy, and applying it to the script execution context.

    // Used by ContentSecurityPolicyMediaListDirective
    void reportInvalidPluginTypes(const String&) const;

    // Used by ContentSecurityPolicyTrustedTypesDirective
    void reportInvalidTrustedTypesPolicy(const String&) const;
    void reportInvalidTrustedTypesNoneKeyword() const;

    void reportInvalidTrustedTypesSinkGroup(const String&) const;
    void reportEmptyRequireTrustedTypesForDirective() const;

    // Used by ContentSecurityPolicySourceList
    void reportDirectiveAsSourceExpression(const String& directiveName, StringView sourceExpression) const;
    void reportInvalidPathCharacter(const String& directiveName, const String& value, const char) const;
    void reportInvalidSourceExpression(const String& directiveName, const String& source) const;
    bool urlMatchesSelf(const URL&, bool forFrameSrc) const;
    bool allowContentSecurityPolicySourceStarToMatchAnyProtocol() const;

    // Used by ContentSecurityPolicyDirectiveList
    void reportDuplicateDirective(const String&) const;
    void reportInvalidDirectiveValueCharacter(const String& directiveName, const String& value) const;
    void reportInvalidSandboxFlags(const String&) const;
    void reportInvalidDirectiveInReportOnlyMode(const String&) const;
    void reportInvalidDirectiveInHTTPEquivMeta(const String&) const;
    void reportMissingReportToTokens(const String&) const;
    void reportMissingReportURI(const String&) const;
    void reportUnsupportedDirective(const String&) const;
    void enforceSandboxFlags(SandboxFlags sandboxFlags) { m_sandboxFlags.add(sandboxFlags); }
    void addHashAlgorithmsForInlineScripts(OptionSet<ContentSecurityPolicyHashAlgorithm> hashAlgorithmsForInlineScripts)
    {
        m_hashAlgorithmsForInlineScripts.add(hashAlgorithmsForInlineScripts);
    }
    void addHashAlgorithmsForInlineStylesheets(OptionSet<ContentSecurityPolicyHashAlgorithm> hashAlgorithmsForInlineStylesheets)
    {
        m_hashAlgorithmsForInlineStylesheets.add(hashAlgorithmsForInlineStylesheets);
    }

    // Used by ContentSecurityPolicySource
    const String& selfProtocol() const { return m_selfSourceProtocol; };

    void setUpgradeInsecureRequests(bool);
    bool upgradeInsecureRequests() const { return m_upgradeInsecureRequests; }
    enum class InsecureRequestType { Load, FormSubmission, Navigation };
    enum class AlwaysUpgradeRequest : bool { No, Yes };
    WEBCORE_EXPORT void upgradeInsecureRequestIfNeeded(ResourceRequest&, InsecureRequestType, AlwaysUpgradeRequest = AlwaysUpgradeRequest::No) const;
    WEBCORE_EXPORT void upgradeInsecureRequestIfNeeded(URL&, InsecureRequestType, AlwaysUpgradeRequest = AlwaysUpgradeRequest::No) const;

    HashSet<SecurityOriginData> takeNavigationRequestsToUpgrade();
    void inheritInsecureNavigationRequestsToUpgradeFromOpener(const ContentSecurityPolicy&);
    void setInsecureNavigationRequestsToUpgrade(HashSet<SecurityOriginData>&&);

    void setClient(ContentSecurityPolicyClient* client) { m_client = client; }
    void updateSourceSelf(const SecurityOrigin&);

    void setDocumentURL(URL& documentURL) { m_documentURL = documentURL; }

    SandboxFlags sandboxFlags() const { return m_sandboxFlags; }

    bool isHeaderDelivered() const { return m_isHeaderDelivered; }

    const String& evalErrorMessage() const { return m_lastPolicyEvalDisabledErrorMessage; }
    const String& webAssemblyErrorMessage() const { return m_lastPolicyWebAssemblyDisabledErrorMessage; }

    ContentSecurityPolicyModeForExtension contentSecurityPolicyModeForExtension() const { return m_contentSecurityPolicyModeForExtension; }

private:
    void logToConsole(const String& message, const String& contextURL = String(), const OrdinalNumber& contextLine = OrdinalNumber::beforeFirst(), const OrdinalNumber& contextColumn = OrdinalNumber::beforeFirst(), JSC::JSGlobalObject* = nullptr) const;
    void applyPolicyToScriptExecutionContext();

    String createURLForReporting(const URL&, const String&, bool usesReportingAPI) const;

    const PAL::TextEncoding documentEncoding() const;

    enum class Disposition {
        Enforce,
        ReportOnly,
    };

    using ViolatedDirectiveCallback = std::function<void (const ContentSecurityPolicyDirective&)>;

    template<typename Predicate, typename... Args>
    typename std::enable_if<!std::is_convertible<Predicate, ViolatedDirectiveCallback>::value, bool>::type allPoliciesWithDispositionAllow(Disposition, Predicate&&, Args&&...) const;

    template<typename Predicate, typename... Args>
    bool allPoliciesWithDispositionAllow(Disposition, ViolatedDirectiveCallback&&, Predicate&&, Args&&...) const;

    template<typename Predicate, typename... Args>
    bool allPoliciesAllow(ViolatedDirectiveCallback&&, Predicate&&, Args&&...) const WARN_UNUSED_RETURN;
    bool shouldPerformEarlyCSPCheck() const;
    
    using ResourcePredicate = const ContentSecurityPolicyDirective *(ContentSecurityPolicyDirectiveList::*)(const URL &, bool) const;
    bool allowResourceFromSource(const URL&, RedirectResponseReceived, ResourcePredicate, const URL& preRedirectURL = URL()) const;

    void reportViolation(const ContentSecurityPolicyDirective& violatedDirective, const String& blockedURL, const String& consoleMessage, JSC::JSGlobalObject*, StringView sourceContent) const;
    void reportViolation(const String& effectiveViolatedDirective, const ContentSecurityPolicyDirectiveList&, const String& blockedURL, const String& consoleMessage, JSC::JSGlobalObject* = nullptr) const;
    void reportViolation(const ContentSecurityPolicyDirective& violatedDirective, const String& blockedURL, const String& consoleMessage, const String& sourceURL, StringView sourceContent, const TextPosition& sourcePosition, const URL& preRedirectURL = URL(), JSC::JSGlobalObject* = nullptr, Element* = nullptr) const;
    void reportViolation(const String& violatedDirective, const ContentSecurityPolicyDirectiveList& violatedDirectiveList, const String& blockedURL, const String& consoleMessage, const String& sourceURL, StringView sourceContent, const TextPosition& sourcePosition, JSC::JSGlobalObject*, const URL& preRedirectURL = URL(), Element* = nullptr) const;
    void reportBlockedScriptExecutionToInspector(const String& directiveText) const;

    // We can never have both a script execution context and a ContentSecurityPolicyClient.
    WeakPtr<ScriptExecutionContext> m_scriptExecutionContext;
    ContentSecurityPolicyClient* m_client { nullptr };
    mutable ReportingClient* m_reportingClient { nullptr };

    URL m_protectedURL;
    std::optional<URL> m_documentURL;
    std::unique_ptr<ContentSecurityPolicySource> m_selfSource;
    String m_selfSourceProtocol;
    CSPDirectiveListVector m_policies;
    String m_lastPolicyEvalDisabledErrorMessage;
    String m_lastPolicyWebAssemblyDisabledErrorMessage;
    String m_referrer;
    SandboxFlags m_sandboxFlags;
    bool m_overrideInlineStyleAllowed { false };
    bool m_isReportingEnabled { true };
    bool m_upgradeInsecureRequests { false };
    bool m_hasAPIPolicy { false };
    int m_httpStatusCode { 0 };
    OptionSet<ContentSecurityPolicyHashAlgorithm> m_hashAlgorithmsForInlineScripts;
    OptionSet<ContentSecurityPolicyHashAlgorithm> m_hashAlgorithmsForInlineStylesheets;
    HashSet<SecurityOriginData> m_insecureNavigationRequestsToUpgrade;
    mutable std::optional<ContentSecurityPolicyResponseHeaders> m_cachedResponseHeaders;
    bool m_isHeaderDelivered { false };
    ContentSecurityPolicyModeForExtension m_contentSecurityPolicyModeForExtension { ContentSecurityPolicyModeForExtension::None };
};

} // namespace WebCore

