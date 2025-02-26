/*
 * Copyright (C) 2010 Nokia Corporation and/or its subsidiary(-ies).
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

#include "PopupMenu.h"
#include <wtf/Forward.h>
#include <wtf/Vector.h>
#include <wtf/WallTime.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

class PopupMenu;

struct RecentSearch {
    String string;
    WallTime time;

    RecentSearch isolatedCopy() const { return { string.isolatedCopy(), time.isolatedCopy() }; }
};

class SearchPopupMenu : public RefCounted<SearchPopupMenu> {
public:
    virtual ~SearchPopupMenu() = default;
    virtual PopupMenu* popupMenu() = 0;
    RefPtr<PopupMenu> protectedPopupMenu() { return popupMenu(); }
    virtual void saveRecentSearches(const AtomString& name, const Vector<RecentSearch>&) = 0;
    virtual void loadRecentSearches(const AtomString& name, Vector<RecentSearch>&) = 0;
    virtual bool enabled() = 0;
};

}
