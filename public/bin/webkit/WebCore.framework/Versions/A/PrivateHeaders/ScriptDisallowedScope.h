/*
 * Copyright (C) 1999 Lars Knoll (knoll@kde.org)
 *           (C) 1999 Antti Koivisto (koivisto@kde.org)
 *           (C) 2001 Dirk Mueller (mueller@kde.org)
 * Copyright (C) 2004-2016 Apple Inc. All rights reserved.
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Library General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Library General Public License for more details.
 *
 * You should have received a copy of the GNU Library General Public License
 * along with this library; see the file COPYING.LIB.  If not, write to
 * the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
 * Boston, MA 02110-1301, USA.
 *
 */

#pragma once

#include "ContainerNode.h"
#include <wtf/MainThread.h>
#include <wtf/RuntimeApplicationChecks.h>

#if PLATFORM(IOS_FAMILY)
#include "WebCoreThread.h"
#endif

namespace WebCore {

class ScriptDisallowedScope {
public:
    // This variant is expensive. Use ScriptDisallowedScope::InMainThread whenever possible.
    ScriptDisallowedScope()
    {
        if (!isMainThread())
            return;
        ++s_count;
    }

    ScriptDisallowedScope(const ScriptDisallowedScope&)
        : ScriptDisallowedScope()
    {
    }

    ~ScriptDisallowedScope()
    {
        if (!isMainThread())
            return;
        ASSERT(s_count);
        s_count--;
    }

    ScriptDisallowedScope& operator=(const ScriptDisallowedScope&)
    {
        return *this;
    }

    static bool isScriptAllowedInMainThread()
    {
        return !isInWebProcess() || !isMainThread() || !s_count;
    }

    class InMainThread {
    public:
        InMainThread()
        {
            ASSERT(isMainThread());
            ++s_count;
        }

        ~InMainThread()
        {
            ASSERT(isMainThread());
            ASSERT(s_count);
            --s_count;
        }

        // Don't enable this assertion in release since it's O(n).
        // Release asserts in canExecuteScript should be sufficient for security defense purposes.
        static bool isEventDispatchAllowedInSubtree(Node& node)
        {
#if ASSERT_ENABLED || ENABLE(SECURITY_ASSERTIONS)
            return isScriptAllowed() || EventAllowedScope::isAllowedNode(node);
#else
            UNUSED_PARAM(node);
            return true;
#endif
        }

        static bool hasDisallowedScope()
        {
            ASSERT(isMainThread());
            return s_count;
        }

        static bool isScriptAllowed()
        {
            ASSERT(isMainThread());
#if PLATFORM(IOS_FAMILY)
            return !s_count || !isInWebProcess() || webThreadDelegateMessageScopeCount;
#else
            return !s_count || !isInWebProcess();
#endif
        }
    };

    class InMainThreadOfWebProcess {
    public:
        InMainThreadOfWebProcess()
            : m_isInWebProcess(isInWebProcess())
        {
            ASSERT(isMainThread());
            if (!m_isInWebProcess)
                return;
            ++s_count;
        }

        ~InMainThreadOfWebProcess()
        {
            ASSERT(isMainThread());
            if (!m_isInWebProcess)
                return;
            ASSERT(s_count);
            --s_count;
        }

    private:
        bool m_isInWebProcess;
    };

#if ASSERT_ENABLED
    class EventAllowedScope {
    public:
        explicit EventAllowedScope(ContainerNode& userAgentContentRoot)
            : m_eventAllowedTreeRoot(userAgentContentRoot)
            , m_previousScope(s_currentScope)
        {
            s_currentScope = this;
        }

        ~EventAllowedScope()
        {
            s_currentScope = m_previousScope;
        }

        static bool isAllowedNode(Node& node)
        {
            return s_currentScope && s_currentScope->isAllowedNodeInternal(node);
        }

    private:
        bool isAllowedNodeInternal(Node& node)
        {
            return m_eventAllowedTreeRoot->contains(&node) || (m_previousScope && m_previousScope->isAllowedNodeInternal(node));
        }

        Ref<ContainerNode> m_eventAllowedTreeRoot;

        EventAllowedScope* m_previousScope;
        static EventAllowedScope* s_currentScope;
    };
#else // not ASSERT_ENABLED
    class EventAllowedScope {
    public:
        explicit EventAllowedScope(ContainerNode&) { }
        static bool isAllowedNode(Node&) { return true; }
    };
#endif // not ASSERT_ENABLED

    // FIXME: Remove this class once the sync layout inside SVGImage::draw is removed,
    // CachedSVGFont::ensureCustomFontData no longer synchronously creates a document during style resolution,
    // and refactored the code in RenderFrameBase::performLayoutWithFlattening.
    class DisableAssertionsInScope {
    public:
        DisableAssertionsInScope()
        {
            ASSERT(isMainThread());
            std::swap(s_count, m_originalCount);
        }

        ~DisableAssertionsInScope()
        {
            s_count = m_originalCount;
        }
    private:
        unsigned m_originalCount { 0 };
    };

private:
    WEBCORE_EXPORT static unsigned s_count;
};

} // namespace WebCore
