/*
    Copyright (C) 2008 Nokia Corporation and/or its subsidiary(-ies)
    Copyright (C) 2015-2022 Apple Inc. All rights reserved.

    This library is free software; you can redistribute it and/or
    modify it under the terms of the GNU Library General Public
    License as published by the Free Software Foundation; either
    version 2 of the License, or (at your option) any later version.

    This library is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
    Library General Public License for more details.

    You should have received a copy of the GNU Library General Public License
    along with this library; see the file COPYING.LIB.  If not, write to
    the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
    Boston, MA 02110-1301, USA.
*/

#pragma once

#include <wtf/RefCounted.h>
#include <wtf/URL.h>
#include <wtf/Vector.h>
#include <wtf/text/StringHash.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

class Page;

enum class PluginLoadClientPolicy : uint8_t {
    // No client-specific plug-in load policy has been defined. The plug-in should be visible in navigator.plugins and WebKit should synchronously
    // ask the client whether the plug-in should be loaded.
    Undefined = 0,

    // The plug-in module should be blocked from being instantiated. The plug-in should be hidden in navigator.plugins.
    Block,

    // WebKit should synchronously ask the client whether the plug-in should be loaded. The plug-in should be visible in navigator.plugins.
    Ask,

    // The plug-in module may be loaded if WebKit is not blocking it.
    Allow,

    // The plug-in module should be loaded irrespective of whether WebKit has asked it to be blocked.
    AllowAlways,
};

struct MimeClassInfo {
    AtomString type;
    String desc;
    Vector<String> extensions;

    friend bool operator==(const MimeClassInfo&, const MimeClassInfo&) = default;
};

struct PluginInfo {
    String name;
    String file;
    String desc;
    Vector<MimeClassInfo> mimes;
    bool isApplicationPlugin { false };

    PluginLoadClientPolicy clientLoadPolicy { PluginLoadClientPolicy::Undefined };

    String bundleIdentifier;
#if PLATFORM(MAC)
    String versionString;
#endif

    friend bool operator==(const PluginInfo&, const PluginInfo&) = default;
};

struct SupportedPluginIdentifier {
    String matchingDomain;
    String pluginIdentifier;
};

// FIXME: merge with PluginDatabase in the future
class PluginData : public RefCounted<PluginData> {
public:
    static Ref<PluginData> create(Page& page) { return adoptRef(*new PluginData(page)); }

    const Vector<PluginInfo>& plugins() const { return m_plugins; }
    WEBCORE_EXPORT const Vector<PluginInfo>& webVisiblePlugins() const;
    WEBCORE_EXPORT Vector<MimeClassInfo> webVisibleMimeTypes() const;

    enum AllowedPluginTypes {
        AllPlugins,
        OnlyApplicationPlugins
    };
    WEBCORE_EXPORT bool supportsMimeType(const String& mimeType, const AllowedPluginTypes) const;
    WEBCORE_EXPORT bool supportsWebVisibleMimeType(const String& mimeType, const AllowedPluginTypes) const;
    WEBCORE_EXPORT bool supportsWebVisibleMimeTypeForURL(const String& mimeType, const AllowedPluginTypes, const URL&) const;

    String pluginFileForWebVisibleMimeType(const String& mimeType) const;

    const std::optional<PluginInfo>& builtInPDFPlugin() const { return m_builtInPDFPluginInfo; }

    static PluginInfo dummyPDFPluginInfo();

private:
    explicit PluginData(Page&);
    void initPlugins();

protected:
    Page& m_page;
    Vector<PluginInfo> m_plugins;
    std::optional<Vector<SupportedPluginIdentifier>> m_supportedPluginIdentifiers;

    struct CachedVisiblePlugins {
        URL pageURL;
        std::optional<Vector<PluginInfo>> pluginList;
    };
    mutable CachedVisiblePlugins m_cachedVisiblePlugins;
    std::optional<PluginInfo> m_builtInPDFPluginInfo;
};

inline bool isSupportedPlugin(const Vector<SupportedPluginIdentifier>& pluginIdentifiers, const URL& pageURL, const String& pluginIdentifier)
{
    return pluginIdentifiers.findIf([&] (auto&& plugin) {
        return pageURL.isMatchingDomain(plugin.matchingDomain) && plugin.pluginIdentifier == pluginIdentifier;
    }) != notFound;
}

} // namespace WebCore
