/*
 * Copyright (C) 2015-2021 Apple Inc. All rights reserved.
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

#if ENABLE(CONTENT_EXTENSIONS)

#include "ContentExtensionStringSerialization.h"
#include <wtf/JSONValues.h>
#include <wtf/Hasher.h>

namespace WebCore {
class ResourceRequest;
}

namespace WebCore::ContentExtensions {

struct Action;

using SerializedActionByte = uint8_t;

template<typename T> struct ActionWithoutMetadata {
    T isolatedCopy() const { return { }; }
    friend bool operator==(const ActionWithoutMetadata&, const ActionWithoutMetadata&) = default;
    void serialize(Vector<uint8_t>&) const { }
    static T deserialize(std::span<const uint8_t>) { return { }; }
    static size_t serializedLength(std::span<const uint8_t>) { return 0; }
};

template<typename T> struct ActionWithStringMetadata {
    String string;
    T isolatedCopy() const & { return { { string.isolatedCopy() } }; }
    T isolatedCopy() && { return { { WTFMove(string).isolatedCopy() } }; }
    friend bool operator==(const ActionWithStringMetadata&, const ActionWithStringMetadata&) = default;
    void serialize(Vector<uint8_t>& vector) const { serializeString(vector, string); }
    static T deserialize(std::span<const uint8_t> span) { return { { deserializeString(span) } }; }
    static size_t serializedLength(std::span<const uint8_t> span) { return stringSerializedLength(span); }
};

struct BlockLoadAction : public ActionWithoutMetadata<BlockLoadAction> { };
struct BlockCookiesAction : public ActionWithoutMetadata<BlockCookiesAction> { };
struct CSSDisplayNoneSelectorAction : public ActionWithStringMetadata<CSSDisplayNoneSelectorAction> { };
struct NotifyAction : public ActionWithStringMetadata<NotifyAction> { };
struct IgnorePreviousRulesAction : public ActionWithoutMetadata<IgnorePreviousRulesAction> { };
struct MakeHTTPSAction : public ActionWithoutMetadata<MakeHTTPSAction> { };

struct WEBCORE_EXPORT ModifyHeadersAction {
    enum class ModifyHeadersOperationType { Unknown, Append, Set, Remove };

    struct ModifyHeaderInfo {
        struct AppendOperation {
            String header;
            String value;

            AppendOperation isolatedCopy() const & { return { header.isolatedCopy(), value.isolatedCopy() }; }
            AppendOperation isolatedCopy() && { return { WTFMove(header).isolatedCopy(), WTFMove(value).isolatedCopy() }; }
            friend bool operator==(const AppendOperation&, const AppendOperation&) = default;
        };
        struct SetOperation {
            String header;
            String value;

            SetOperation isolatedCopy() const & { return { header.isolatedCopy(), value.isolatedCopy() }; }
            SetOperation isolatedCopy() && { return { WTFMove(header).isolatedCopy(), WTFMove(value).isolatedCopy() }; }
            friend bool operator==(const SetOperation&, const SetOperation&) = default;
        };
        struct RemoveOperation {
            String header;

            RemoveOperation isolatedCopy() const & { return { header.isolatedCopy() }; }
            RemoveOperation isolatedCopy() && { return { WTFMove(header).isolatedCopy() }; }
            friend bool operator==(const RemoveOperation&, const RemoveOperation&) = default;
        };
        using OperationVariant = std::variant<AppendOperation, SetOperation, RemoveOperation>;
        OperationVariant operation;

        static Expected<ModifyHeaderInfo, std::error_code> parse(const JSON::Value&);
        ModifyHeaderInfo isolatedCopy() const &;
        ModifyHeaderInfo isolatedCopy() &&;
        friend bool operator==(const ModifyHeaderInfo&, const ModifyHeaderInfo&) = default;
        void serialize(Vector<uint8_t>&) const;
        static ModifyHeaderInfo deserialize(std::span<const uint8_t>);
        static size_t serializedLength(std::span<const uint8_t>);
        void applyToRequest(ResourceRequest&, UncheckedKeyHashMap<String, ModifyHeadersOperationType>&);
    };

    enum class HashTableType : uint8_t { Empty, Deleted, Full } hashTableType;
    Vector<ModifyHeaderInfo> requestHeaders;
    Vector<ModifyHeaderInfo> responseHeaders;
    uint32_t priority = 0;

    ModifyHeadersAction(Vector<ModifyHeaderInfo>&& requestHeaders, Vector<ModifyHeaderInfo>&& responseHeaders, uint32_t priority)
        : hashTableType(HashTableType::Full)
        , requestHeaders(WTFMove(requestHeaders))
        , responseHeaders(WTFMove(responseHeaders))
        , priority(priority) { }

    enum EmptyValueTag { EmptyValue };
    enum DeletedValueTag { DeletedValue };
    ModifyHeadersAction(EmptyValueTag) : hashTableType(HashTableType::Empty) { }
    ModifyHeadersAction(DeletedValueTag) : hashTableType(HashTableType::Deleted) { }
    bool isDeletedValue() const { return hashTableType == HashTableType::Deleted; }

    static Expected<ModifyHeadersAction, std::error_code> parse(const JSON::Object&);
    ModifyHeadersAction isolatedCopy() const &;
    ModifyHeadersAction isolatedCopy() &&;
    friend bool operator==(const ModifyHeadersAction&, const ModifyHeadersAction&) = default;
    void serialize(Vector<uint8_t>&) const;
    static ModifyHeadersAction deserialize(std::span<const uint8_t>);
    static size_t serializedLength(std::span<const uint8_t>);
    void applyToRequest(ResourceRequest&, UncheckedKeyHashMap<String, ModifyHeadersOperationType>&);
};

struct WEBCORE_EXPORT RedirectAction {
    struct ExtensionPathAction {
        String extensionPath;

        ExtensionPathAction isolatedCopy() const & { return { extensionPath.isolatedCopy() }; }
        ExtensionPathAction isolatedCopy() && { return { WTFMove(extensionPath).isolatedCopy() }; }
        friend bool operator==(const ExtensionPathAction&, const ExtensionPathAction&) = default;
    };
    struct RegexSubstitutionAction {
        String regexSubstitution;
        String regexFilter;

        RegexSubstitutionAction isolatedCopy() const & { return { regexSubstitution.isolatedCopy(), regexFilter.isolatedCopy() }; }
        RegexSubstitutionAction isolatedCopy() && { return { WTFMove(regexSubstitution).isolatedCopy(), WTFMove(regexFilter).isolatedCopy() }; }
        void serialize(Vector<uint8_t>&) const;
        static RegexSubstitutionAction deserialize(std::span<const uint8_t>);
        friend bool operator==(const RegexSubstitutionAction&, const RegexSubstitutionAction&) = default;
        WEBCORE_EXPORT void applyToURL(URL&) const;
    };
    struct URLTransformAction {
        struct QueryTransform {
            struct QueryKeyValue {
                String key;
                bool replaceOnly { false };
                String value;

                static Expected<QueryKeyValue, std::error_code> parse(const JSON::Value&);
                QueryKeyValue isolatedCopy() const & { return { key.isolatedCopy(), replaceOnly, value.isolatedCopy() }; }
                QueryKeyValue isolatedCopy() && { return { WTFMove(key).isolatedCopy(), replaceOnly, WTFMove(value).isolatedCopy() }; }
                friend bool operator==(const QueryKeyValue&, const QueryKeyValue&) = default;
                void serialize(Vector<uint8_t>&) const;
                static QueryKeyValue deserialize(std::span<const uint8_t>);
                static size_t serializedLength(std::span<const uint8_t>);
            };

            Vector<QueryKeyValue> addOrReplaceParams;
            Vector<String> removeParams;

            static Expected<QueryTransform, std::error_code> parse(const JSON::Object&);
            QueryTransform isolatedCopy() const &;
            QueryTransform isolatedCopy() &&;
            friend bool operator==(const QueryTransform&, const QueryTransform&) = default;
            void serialize(Vector<uint8_t>&) const;
            static QueryTransform deserialize(std::span<const uint8_t>);
            static size_t serializedLength(std::span<const uint8_t>);
            void applyToURL(URL&) const;
        };

        String fragment;
        String host;
        String password;
        String path;
        std::optional<std::optional<uint16_t>> port;
        using QueryTransformVariant = std::variant<String, QueryTransform>;
        QueryTransformVariant queryTransform;
        String scheme;
        String username;

        static Expected<URLTransformAction, std::error_code> parse(const JSON::Object&);
        URLTransformAction isolatedCopy() const &;
        URLTransformAction isolatedCopy() &&;
        friend bool operator==(const URLTransformAction&, const URLTransformAction&) = default;
        void serialize(Vector<uint8_t>&) const;
        static URLTransformAction deserialize(std::span<const uint8_t>);
        static size_t serializedLength(std::span<const uint8_t>);
        void applyToURL(URL&) const;
    };
    struct URLAction {
        String url;

        URLAction isolatedCopy() const & { return { url.isolatedCopy() }; }
        URLAction isolatedCopy() && { return { WTFMove(url).isolatedCopy() }; }
        friend bool operator==(const URLAction&, const URLAction&) = default;
    };

    enum class HashTableType : uint8_t { Empty, Deleted, Full } hashTableType;
    using ActionVariant = std::variant<ExtensionPathAction, RegexSubstitutionAction, URLTransformAction, URLAction>;
    ActionVariant action;

    RedirectAction(ActionVariant&& action)
        : hashTableType(HashTableType::Full)
        , action(WTFMove(action)) { }

    enum EmptyValueTag { EmptyValue };
    enum DeletedValueTag { DeletedValue };
    RedirectAction(EmptyValueTag) : hashTableType(HashTableType::Empty) { }
    RedirectAction(DeletedValueTag) : hashTableType(HashTableType::Deleted) { }
    bool isDeletedValue() const { return hashTableType == HashTableType::Deleted; }

    static Expected<RedirectAction, std::error_code> parse(const JSON::Object&, const String& urlFilter);
    RedirectAction isolatedCopy() const &;
    RedirectAction isolatedCopy() &&;
    friend bool operator==(const RedirectAction&, const RedirectAction&) = default;
    void serialize(Vector<uint8_t>&) const;
    static RedirectAction deserialize(std::span<const uint8_t>);
    static size_t serializedLength(std::span<const uint8_t>);
    void applyToRequest(ResourceRequest&, const URL&);
};

using ActionData = std::variant<
    BlockLoadAction,
    BlockCookiesAction,
    CSSDisplayNoneSelectorAction,
    NotifyAction,
    IgnorePreviousRulesAction,
    MakeHTTPSAction,
    ModifyHeadersAction,
    RedirectAction
>;

inline void add(Hasher& hasher, const ModifyHeadersAction::ModifyHeaderInfo::AppendOperation& operation)
{
    add(hasher, operation.header, operation.value);
}

inline void add(Hasher& hasher, const ModifyHeadersAction::ModifyHeaderInfo::SetOperation& operation)
{
    add(hasher, operation.header, operation.value);
}

inline void add(Hasher& hasher, const ModifyHeadersAction::ModifyHeaderInfo::RemoveOperation& operation)
{
    add(hasher, operation.header);
}

inline void add(Hasher& hasher, const ModifyHeadersAction::ModifyHeaderInfo& info)
{
    add(hasher, info.operation);
}

inline void add(Hasher& hasher, const RedirectAction::ExtensionPathAction& action)
{
    add(hasher, action.extensionPath);
}

inline void add(Hasher& hasher, const RedirectAction::RegexSubstitutionAction& action)
{
    add(hasher, action.regexSubstitution, action.regexFilter);
}

inline void add(Hasher& hasher, const RedirectAction::URLTransformAction::QueryTransform::QueryKeyValue& queryKeyValue)
{
    add(hasher, queryKeyValue.key, queryKeyValue.replaceOnly, queryKeyValue.value);
}

inline void add(Hasher& hasher, const RedirectAction::URLTransformAction::QueryTransform& transform)
{
    add(hasher, transform.addOrReplaceParams, transform.removeParams);
}

inline void add(Hasher& hasher, const RedirectAction::URLAction& action)
{
    add(hasher, action.url);
}

inline void add(Hasher& hasher, const RedirectAction::URLTransformAction& action)
{
    add(hasher, action.fragment, action.host, action.password, action.path, action.port, action.queryTransform, action.scheme, action.username);
}

inline void add(Hasher& hasher, const RedirectAction& action)
{
    add(hasher, action.action);
}

inline void add(Hasher& hasher, const ModifyHeadersAction& action)
{
    add(hasher, action.requestHeaders, action.responseHeaders, action.priority);
}

} // namespace WebCore::ContentExtensions

namespace WTF {

template<> struct DefaultHash<WebCore::ContentExtensions::RedirectAction> {
    using Action = WebCore::ContentExtensions::RedirectAction;
    static uint32_t hash(const Action& action) { return computeHash(action); }
    static bool equal(const Action& a, const Action& b) { return a == b; }
    static constexpr bool safeToCompareToEmptyOrDeleted = true;
};
template<> struct HashTraits<WebCore::ContentExtensions::RedirectAction> : public CustomHashTraits<WebCore::ContentExtensions::RedirectAction> { };

template<> struct DefaultHash<WebCore::ContentExtensions::ModifyHeadersAction> {
    using Action = WebCore::ContentExtensions::ModifyHeadersAction;
    static uint32_t hash(const Action& action) { return computeHash(action); }
    static bool equal(const Action& a, const Action& b) { return a == b; }
    static constexpr bool safeToCompareToEmptyOrDeleted = true;
};
template<> struct HashTraits<WebCore::ContentExtensions::ModifyHeadersAction> : public CustomHashTraits<WebCore::ContentExtensions::ModifyHeadersAction> { };

} // namespace WTF

#endif // ENABLE(CONTENT_EXTENSIONS)
