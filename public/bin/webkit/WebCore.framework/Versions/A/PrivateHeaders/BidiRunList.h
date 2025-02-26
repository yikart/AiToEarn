/*
 * Copyright (C) 2000 Lars Knoll (knoll@kde.org)
 * Copyright (C) 2003-2023 Apple Inc.  All right reserved.
 * Copyright (C) 2011-2014 Google, Inc.  All rights reserved.
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

#ifndef BidiRunList_h
#define BidiRunList_h

#include <wtf/Noncopyable.h>

namespace WebCore {

template <class Run>
class BidiRunList {
    WTF_MAKE_NONCOPYABLE(BidiRunList);
public:
    BidiRunList()
        : m_lastRun(nullptr)
        , m_logicallyLastRun(nullptr)
        , m_runCount(0)
    {
    }

    // FIXME: Once BidiResolver no longer owns the BidiRunList,
    // then ~BidiRunList should call deleteRuns() automatically.

    Run* firstRun() const { return m_firstRun.get(); }
    Run* lastRun() const { return m_lastRun; }
    Run* logicallyLastRun() const { return m_logicallyLastRun; }
    unsigned runCount() const { return m_runCount; }

    void appendRun(std::unique_ptr<Run>&&);
    void prependRun(std::unique_ptr<Run>&&);

    void moveRunToEnd(Run*);
    void moveRunToBeginning(Run*);

    void clear();
    void reverseRuns(unsigned start, unsigned end);
    void reorderRunsFromLevels();

    void setLogicallyLastRun(Run* run) { m_logicallyLastRun = run; }

    void replaceRunWithRuns(Run* toReplace, BidiRunList<Run>& newRuns);

private:

    // The runs form a singly-linked-list, where the links (Run::m_next) imply ownership (and are of type std::unique_ptr).
    // The raw pointers below point into the singly-linked-list.
    std::unique_ptr<Run> m_firstRun; // The head of the list
    Run* m_lastRun;
    Run* m_logicallyLastRun;
    unsigned m_runCount;
};

template <class Run>
inline void BidiRunList<Run>::appendRun(std::unique_ptr<Run>&& run)
{
    if (!m_firstRun) {
        m_firstRun = WTFMove(run);
        m_lastRun = m_firstRun.get();
    } else {
        m_lastRun->setNext(WTFMove(run));
        m_lastRun = m_lastRun->next();
    }
    m_runCount++;
}

template <class Run>
inline void BidiRunList<Run>::prependRun(std::unique_ptr<Run>&& run)
{
    ASSERT(!run->next());

    if (!m_lastRun)
        m_lastRun = run.get();
    else
        run->setNext(WTFMove(m_firstRun));
    m_firstRun = WTFMove(run);
    m_runCount++;
}

template <class Run>
inline void BidiRunList<Run>::moveRunToEnd(Run* run)
{
    ASSERT(m_firstRun);
    ASSERT(m_lastRun);
    ASSERT(run->next());

    Run* previous = nullptr;
    Run* current = m_firstRun.get();
    while (current != run) {
        previous = current;
        current = previous->next();
    }

    if (!previous) {
        ASSERT(m_firstRun.get() == run);
        std::unique_ptr<Run> originalFirstRun = WTFMove(m_firstRun);
        m_firstRun = originalFirstRun->takeNext();
        m_lastRun->setNext(WTFMove(originalFirstRun));
    } else {
        std::unique_ptr<Run> target = previous->takeNext();
        previous->setNext(current->takeNext());
        m_lastRun->setNext(WTFMove(target));
    }
}

template <class Run>
inline void BidiRunList<Run>::moveRunToBeginning(Run* run)
{
    ASSERT(m_firstRun);
    ASSERT(m_lastRun);
    ASSERT(run != m_firstRun.get());

    Run* previous = m_firstRun.get();
    Run* current = previous->next();
    while (current != run) {
        previous = current;
        current = previous->next();
    }

    std::unique_ptr<Run> target = previous->takeNext();
    previous->setNext(run->takeNext());
    if (run == m_lastRun)
        m_lastRun = previous;

    target->setNext(WTFMove(m_firstRun));
    m_firstRun = WTFMove(target);
}

template <class Run>
void BidiRunList<Run>::replaceRunWithRuns(Run* toReplace, BidiRunList<Run>& newRuns)
{
    ASSERT(newRuns.runCount());
    ASSERT(m_firstRun);
    ASSERT(toReplace);

    m_runCount += newRuns.runCount() - 1; // We are adding the new runs and removing toReplace.

    // Fix up any pointers which may end up stale.
    if (m_lastRun == toReplace)
        m_lastRun = newRuns.lastRun();
    if (m_logicallyLastRun == toReplace)
        m_logicallyLastRun = newRuns.logicallyLastRun();

    if (m_firstRun.get() == toReplace) {
        newRuns.m_lastRun->setNext(m_firstRun->takeNext());
        m_firstRun = WTFMove(newRuns.m_firstRun);
    } else {
        // Find the run just before "toReplace" in the list of runs.
        Run* previousRun = m_firstRun.get();
        while (previousRun->next() && previousRun->next() != toReplace)
            previousRun = previousRun->next();
        ASSERT(previousRun);

        std::unique_ptr<Run> target = previousRun->takeNext();
        previousRun->setNext(WTFMove(newRuns.m_firstRun));
        newRuns.m_lastRun->setNext(target->takeNext());
    }

    newRuns.clear();
}

template <class Run>
void BidiRunList<Run>::clear()
{
    m_firstRun = nullptr;
    m_lastRun = nullptr;
    m_logicallyLastRun = nullptr;
    m_runCount = 0;
}

template <class Run>
void BidiRunList<Run>::reverseRuns(unsigned start, unsigned end)
{
    if (start >= end)
        return;

    ASSERT_WITH_SECURITY_IMPLICATION(end < m_runCount);

    // Get the item before the start of the runs to reverse and put it in
    // |beforeStart|. |curr| should point to the first run to reverse.
    Run* curr = m_firstRun.get();
    Run* beforeStart = nullptr;
    unsigned i = 0;
    for (; i < start; ++i) {
        beforeStart = curr;
        curr = curr->next();
    }
    Run* startRun = curr;

    for (; i < end; ++i)
        curr = curr->next();

    if (!curr->next())
        m_lastRun = startRun;

    // Standard "sliding window" of 3 pointers
    std::unique_ptr<Run> previous = curr->takeNext();
    std::unique_ptr<Run> current = beforeStart ? beforeStart->takeNext() : WTFMove(m_firstRun);
    while (current) {
        std::unique_ptr<Run> next = current->takeNext();
        current->setNext(WTFMove(previous));
        previous = WTFMove(current);
        current = WTFMove(next);
    }

    if (beforeStart)
        beforeStart->setNext(WTFMove(previous));
    else
        m_firstRun = WTFMove(previous);
}

} // namespace WebCore

#endif // BidiRunList
