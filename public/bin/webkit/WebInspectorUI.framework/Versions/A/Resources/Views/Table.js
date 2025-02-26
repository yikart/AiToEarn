/*
 * Copyright (C) 2008-2018 Apple Inc. All Rights Reserved.
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

WI.Table = class Table extends WI.View
{
    constructor(identifier, dataSource, delegate, rowHeight)
    {
        super();

        console.assert(typeof identifier === "string");
        console.assert(dataSource);
        console.assert(delegate);
        console.assert(rowHeight > 0);

        this._identifier = identifier;
        this._dataSource = dataSource;
        this._delegate = delegate;
        this._rowHeight = rowHeight;

        // FIXME: Should be able to horizontally scroll non-locked table contents.
        // To do this smoothly (without tearing) will require synchronous scroll events, or
        // synchronized scrolling between multiple elements, or making `position: sticky`
        // respect different vertical / horizontal scroll containers.

        this.element.classList.add("table", identifier);
        this.element.tabIndex = 0;
        this.element.addEventListener("keydown", this._handleKeyDown.bind(this));

        this._headerElement = this.element.appendChild(document.createElement("div"));
        this._headerElement.className = "header";

        let scrollHandler = this._handleScroll.bind(this);
        this._scrollContainerElement = this.element.appendChild(document.createElement("div"));
        this._scrollContainerElement.className = "data-container";
        this._scrollContainerElement.addEventListener("scroll", scrollHandler);
        this._scrollContainerElement.addEventListener("mousewheel", scrollHandler);
        this._scrollContainerElement.addEventListener("mousedown", this._handleMouseDown.bind(this));
        if (this._delegate.tableCellContextMenuClicked)
            this._scrollContainerElement.addEventListener("contextmenu", this._handleContextMenu.bind(this));

        this._topSpacerElement = this._scrollContainerElement.appendChild(document.createElement("div"));
        this._topSpacerElement.className = "spacer";

        this._listElement = this._scrollContainerElement.appendChild(document.createElement("ul"));
        this._listElement.className = "data-list";

        this._bottomSpacerElement = this._scrollContainerElement.appendChild(document.createElement("div"));
        this._bottomSpacerElement.className = "spacer";

        this._fillerRow = this._listElement.appendChild(document.createElement("li"));
        this._fillerRow.className = "filler";

        this._resizersElement = this._element.appendChild(document.createElement("div"));
        this._resizersElement.className = "resizers";

        this._cachedRows = new Map;

        this._columnSpecs = new Map;
        this._columnOrder = [];
        this._visibleColumns = [];
        this._hiddenColumns = [];

        this._widthGeneration = 1;
        this._columnWidths = null; // Calculated in _resizeColumnsAndFiller.
        this._fillerHeight = 0; // Calculated in _resizeColumnsAndFiller.

        let selectionComparator = WI.SelectionController.createListComparator(this._indexForRepresentedObject.bind(this));
        this._selectionController = new WI.SelectionController(this, selectionComparator);

        this._resizers = [];
        this._currentResizer = null;
        this._resizeLeftColumns = null;
        this._resizeRightColumns = null;
        this._resizeOriginalColumnWidths = null;
        this._lastColumnIndexToAcceptRemainderPixel = 0;

        this._sortOrderSetting = new WI.Setting(this._identifier + "-sort-order", WI.Table.SortOrder.Indeterminate);
        this._sortColumnIdentifierSetting = new WI.Setting(this._identifier + "-sort", null);
        this._columnVisibilitySetting = new WI.Setting(this._identifier + "-column-visibility", {});

        this._sortOrder = this._sortOrderSetting.value;
        this._sortColumnIdentifier = this._sortColumnIdentifierSetting.value;

        this._cachedWidth = NaN;
        this._cachedHeight = NaN;
        this._cachedScrollTop = NaN;
        this._previousCachedWidth = NaN;
        this._previousRevealedRowCount = NaN;
        this._topSpacerHeight = NaN;
        this._bottomSpacerHeight = NaN;
        this._visibleRowIndexStart = NaN;
        this._visibleRowIndexEnd = NaN;

        console.assert(this._dataSource.tableNumberOfRows, "Table data source must implement tableNumberOfRows.");
        console.assert(this._dataSource.tableIndexForRepresentedObject, "Table data source must implement tableIndexForRepresentedObject.");
        console.assert(this._dataSource.tableRepresentedObjectForIndex, "Table data source must implement tableRepresentedObjectForIndex.");

        console.assert(this._delegate.tablePopulateCell, "Table delegate must implement tablePopulateCell.");
    }

    // Public

    get identifier() { return this._identifier; }
    get dataSource() { return this._dataSource; }
    get delegate() { return this._delegate; }
    get rowHeight() { return this._rowHeight; }

    get selectedRow()
    {
        let item = this._selectionController.lastSelectedItem;
        let index = this._indexForRepresentedObject(item);
        return index >= 0 ? index : NaN;
    }

    get selectedRows()
    {
        let rowIndexes = [];
        for (let item of this._selectionController.selectedItems)
            rowIndexes.push(this._indexForRepresentedObject(item));
        return rowIndexes;
    }

    get scrollContainer() { return this._scrollContainerElement; }

    get numberOfRows()
    {
        return this._dataSource.tableNumberOfRows(this);
    }

    get sortOrder()
    {
        return this._sortOrder;
    }

    set sortOrder(sortOrder)
    {
        if (sortOrder === this._sortOrder && this.didInitialLayout)
            return;

        console.assert(sortOrder === WI.Table.SortOrder.Indeterminate || sortOrder === WI.Table.SortOrder.Ascending || sortOrder === WI.Table.SortOrder.Descending);

        this._sortOrder = sortOrder;
        this._sortOrderSetting.value = sortOrder;

        if (this._sortColumnIdentifier) {
            let column = this._columnSpecs.get(this._sortColumnIdentifier);
            let columnIndex = this._visibleColumns.indexOf(column);
            if (columnIndex !== -1) {
                let headerCell = this._headerElement.children[columnIndex];
                headerCell.classList.toggle("sort-ascending", this._sortOrder === WI.Table.SortOrder.Ascending);
                headerCell.classList.toggle("sort-descending", this._sortOrder === WI.Table.SortOrder.Descending);
            }

            if (this._dataSource.tableSortChanged)
                this._dataSource.tableSortChanged(this);
        }
    }

    get sortColumnIdentifier()
    {
        return this._sortColumnIdentifier;
    }

    set sortColumnIdentifier(columnIdentifier)
    {
        if (columnIdentifier === this._sortColumnIdentifier && this.didInitialLayout)
            return;

        let column = this._columnSpecs.get(columnIdentifier);

        console.assert(column, "Column not found.", columnIdentifier);
        if (!column)
            return;

        console.assert(column.sortable, "Column is not sortable.", columnIdentifier);
        if (!column.sortable)
            return;

        let oldSortColumnIdentifier = this._sortColumnIdentifier;
        this._sortColumnIdentifier = columnIdentifier;
        this._sortColumnIdentifierSetting.value = columnIdentifier;

        if (oldSortColumnIdentifier) {
            let oldColumn = this._columnSpecs.get(oldSortColumnIdentifier);
            let oldColumnIndex = this._visibleColumns.indexOf(oldColumn);
            if (oldColumnIndex !== -1) {
                let headerCell = this._headerElement.children[oldColumnIndex];
                headerCell.classList.remove("sort-ascending", "sort-descending");
            }
        }

        if (this._sortColumnIdentifier) {
            let newColumnIndex = this._visibleColumns.indexOf(column);
            if (newColumnIndex !== -1) {
                let headerCell = this._headerElement.children[newColumnIndex];
                headerCell.classList.toggle("sort-ascending", this._sortOrder === WI.Table.SortOrder.Ascending);
                headerCell.classList.toggle("sort-descending", this._sortOrder === WI.Table.SortOrder.Descending);
            } else
                this._sortColumnIdentifier = null;
        }

        if (this._dataSource.tableSortChanged)
            this._dataSource.tableSortChanged(this);
    }

    get allowsMultipleSelection()
    {
        return this._selectionController.allowsMultipleSelection;
    }

    set allowsMultipleSelection(flag)
    {
        this._selectionController.allowsMultipleSelection = flag;
    }

    get columns()
    {
        return Array.from(this._columnSpecs.values());
    }

    isRowSelected(rowIndex)
    {
        return this._selectionController.hasSelectedItem(this._representedObjectForIndex(rowIndex));
    }

    reloadData()
    {
        this._cachedRows.clear();

        this._selectionController.reset();

        this._previousRevealedRowCount = NaN;
        this.needsLayout();
    }

    reloadDataAddedToEndOnly()
    {
        this._previousRevealedRowCount = NaN;
        this.needsLayout();
    }

    reloadRow(rowIndex)
    {
        // Visible row, repopulate the cell.
        if (this._isRowVisible(rowIndex)) {
            let row = this._cachedRows.get(rowIndex);
            if (!row)
                return;
            this._populateRow(row);
            return;
        }

        // Non-visible row, will populate when it becomes visible.
        this._cachedRows.delete(rowIndex);
    }

    restyleRow(rowIndex)
    {
        if (!this._isRowVisible(rowIndex))
            return;

        let row = this._cachedRows.get(rowIndex);
        if (!row)
            return;

        this._styleRow(row);
    }

    reloadVisibleColumnCells(column)
    {
        let columnIndex = this._visibleColumns.indexOf(column);
        if (columnIndex === -1)
            return;

        let numberOfRows = Math.min(this._visibleRowIndexEnd, this.numberOfRows);
        for (let rowIndex = this._visibleRowIndexStart; rowIndex < numberOfRows; ++rowIndex) {
            let row = this._cachedRows.get(rowIndex);
            if (!row)
                continue;
            let cell = row.children[columnIndex];
            if (!cell)
                continue;
            this._delegate.tablePopulateCell(this, cell, column, rowIndex);
        }
    }

    reloadCell(rowIndex, columnIdentifier)
    {
        let column = this._columnSpecs.get(columnIdentifier);
        let columnIndex = this._visibleColumns.indexOf(column);
        if (columnIndex === -1)
            return;

        // Visible row, repopulate the cell.
        if (this._isRowVisible(rowIndex)) {
            let row = this._cachedRows.get(rowIndex);
            if (!row)
                return;
            let cell = row.children[columnIndex];
            if (!cell)
                return;
            this._delegate.tablePopulateCell(this, cell, column, rowIndex);
            return;
        }

        // Non-visible row, will populate when it becomes visible.
        this._cachedRows.delete(rowIndex);
    }

    selectRow(rowIndex, extendSelection = false)
    {
        this._selectionController.selectItem(this._representedObjectForIndex(rowIndex), extendSelection);
    }

    deselectRow(rowIndex)
    {
        this._selectionController.deselectItem(this._representedObjectForIndex(rowIndex));
    }

    selectAll()
    {
        this._selectionController.selectAll();
    }

    deselectAll()
    {
        this._selectionController.deselectAll();
    }

    removeRow(rowIndex)
    {
        console.assert(rowIndex >= 0 && rowIndex < this.numberOfRows);

        if (this.isRowSelected(rowIndex))
            this.deselectRow(rowIndex);

        this._removeRows(new Set([this._representedObjectForIndex(rowIndex)]));
    }

    removeSelectedRows()
    {
        let selectedItems = this._selectionController.selectedItems;
        if (!selectedItems.size)
            return;

        // Change the selection before removing rows. This matches the behavior
        // of macOS Finder (in list and column modes) when removing selected items.
        this._selectionController.removeSelectedItems();

        this._removeRows(selectedItems);
    }

    revealRow(rowIndex)
    {
        console.assert(rowIndex >= 0 && rowIndex < this.numberOfRows);
        if (rowIndex < 0 || rowIndex >= this.numberOfRows)
            return;

        if (this._isRowVisible(rowIndex)) {
            let row = this._cachedRows.get(rowIndex);
            console.assert(row, "Visible rows should always be in the cache.");
            if (row) {
                row.scrollIntoViewIfNeeded(false);
                this._cachedScrollTop = NaN;
                this.needsLayout();
            }
        } else {
            let rowPosition = rowIndex * this._rowHeight;
            let scrollableOffsetHeight = this._calculateOffsetHeight();
            let scrollTop = this._calculateScrollTop();
            let newScrollTop = NaN;
            if (rowPosition + this._rowHeight < scrollTop)
                newScrollTop = rowPosition;
            else if (rowPosition > scrollTop + scrollableOffsetHeight)
                newScrollTop = scrollTop + scrollableOffsetHeight - this._rowHeight;

            if (!isNaN(newScrollTop)) {
                this._scrollContainerElement.scrollTop = newScrollTop;
                this.updateLayout();
            }
        }
    }

    columnWithIdentifier(identifier)
    {
        return this._columnSpecs.get(identifier);
    }

    cellForRowAndColumn(rowIndex, column)
    {
        if (!this._isRowVisible(rowIndex))
            return null;

        let row = this._cachedRows.get(rowIndex);
        if (!row)
            return null;

        let columnIndex = this._visibleColumns.indexOf(column);
        if (columnIndex === -1)
            return null;

        return row.children[columnIndex];
    }

    addColumn(column)
    {
        this._columnSpecs.set(column.identifier, column);
        this._columnOrder.push(column.identifier);

        if (column.hidden) {
            this._hiddenColumns.push(column);
            column.width = NaN;
        } else {
            this._visibleColumns.push(column);
            this._headerElement.appendChild(this._createHeaderCell(column));
            this._fillerRow.appendChild(this._createFillerCell(column));
            if (column.headerView)
                this.addSubview(column.headerView);
        }

        // Restore saved user-specified column visibility.
        let savedColumnVisibility = this._columnVisibilitySetting.value;
        if (column.identifier in savedColumnVisibility) {
            let visible = savedColumnVisibility[column.identifier];
            if (visible)
                this.showColumn(column);
            else
                this.hideColumn(column);
        }

        this.reloadData();
    }

    showColumn(column)
    {
        console.assert(this._columnSpecs.get(column.identifier) === column, "Column not in this table.");
        console.assert(!column.locked, "Locked columns should always be shown.");
        if (column.locked)
            return;

        if (!column.hidden)
            return;

        column.hidden = false;

        let columnIndex = this._hiddenColumns.indexOf(column);
        this._hiddenColumns.splice(columnIndex, 1);

        let newColumnIndex = this._indexToInsertColumn(column);
        this._visibleColumns.insertAtIndex(column, newColumnIndex);

        // Save user preference for this column to be visible.
        let savedColumnVisibility = this._columnVisibilitySetting.value;
        if (savedColumnVisibility[column.identifier] !== true) {
            let copy = Object.shallowCopy(savedColumnVisibility);
            if (column.defaultHidden)
                copy[column.identifier] = true;
            else
                delete copy[column.identifier];
            this._columnVisibilitySetting.value = copy;
        }

        this._headerElement.insertBefore(this._createHeaderCell(column), this._headerElement.children[newColumnIndex]);
        this._fillerRow.insertBefore(this._createFillerCell(column), this._fillerRow.children[newColumnIndex]);

        if (column.headerView)
            this.addSubview(column.headerView);

        if (this._sortColumnIdentifier === column.identifier) {
            let headerCell = this._headerElement.children[newColumnIndex];
            headerCell.classList.toggle("sort-ascending", this._sortOrder === WI.Table.SortOrder.Ascending);
            headerCell.classList.toggle("sort-descending", this._sortOrder === WI.Table.SortOrder.Descending);
        }

        // We haven't yet done any layout, nothing to do.
        if (!this._columnWidths)
            return;

        // To avoid recreating all the cells in the row we create empty cells,
        // size them, and then populate them. We always populate a cell after
        // it has been sized.
        let cellsToPopulate = [];
        for (let row of this._listElement.children) {
            if (row !== this._fillerRow) {
                let unpopulatedCell = this._createCell(column, newColumnIndex);
                cellsToPopulate.push(unpopulatedCell);
                row.insertBefore(unpopulatedCell, row.children[newColumnIndex]);
            }
        }

        // Re-layout all columns to make space.
        this._widthGeneration++;
        this._columnWidths = null;
        this._resizeColumnsAndFiller();

        // Now populate only the new cells for this column.
        for (let cell of cellsToPopulate)
            this._delegate.tablePopulateCell(this, cell, column, cell.parentElement.__index);

        // Now populate columns that may be sensitive to resizes.
        for (let visibleColumn of this._visibleColumns) {
            if (visibleColumn !== column) {
                if (visibleColumn.needsReloadOnResize)
                    this.reloadVisibleColumnCells(visibleColumn);
            }
        }
    }

    hideColumn(column)
    {
        console.assert(this._columnSpecs.get(column.identifier) === column, "Column not in this table.");
        console.assert(!column.locked, "Locked columns should always be shown.");
        if (column.locked)
            return;

        console.assert(column.hideable, "Column is not hideable so should always be shown.");
        if (!column.hideable)
            return;

        if (column.hidden)
            return;

        column.hidden = true;

        this._hiddenColumns.push(column);

        let columnIndex = this._visibleColumns.indexOf(column);
        this._visibleColumns.splice(columnIndex, 1);

        // Save user preference for this column to be hidden.
        let savedColumnVisibility = this._columnVisibilitySetting.value;
        if (savedColumnVisibility[column.identifier] !== false) {
            let copy = Object.shallowCopy(savedColumnVisibility);
            if (column.defaultHidden)
                delete copy[column.identifier];
            else
                copy[column.identifier] = false;
            this._columnVisibilitySetting.value = copy;
        }

        this._headerElement.removeChild(this._headerElement.children[columnIndex]);
        this._fillerRow.removeChild(this._fillerRow.children[columnIndex]);

        if (column.headerView)
            this.removeSubview(column.headerView);

        // We haven't yet done any layout, nothing to do.
        if (!this._columnWidths)
            return;

        for (let row of this._listElement.children) {
            if (row !== this._fillerRow)
                row.removeChild(row.children[columnIndex]);
        }

        // Re-layout all columns to make space.
        this._widthGeneration++;
        this._columnWidths = null;
        this._resizeColumnsAndFiller();

        // Now populate columns that may be sensitive to resizes.
        for (let visibleColumn of this._visibleColumns) {
            if (visibleColumn.needsReloadOnResize)
                this.reloadVisibleColumnCells(visibleColumn);
        }
    }

    // Protected

    attached()
    {
        super.attached();

        if (this._cachedScrollTop && !this._scrollContainerElement.scrollTop)
            this._scrollContainerElement.scrollTop = this._cachedScrollTop;
    }

    initialLayout()
    {
        this.sortOrder = this._sortOrderSetting.value;

        let restoreSortColumnIdentifier = this._sortColumnIdentifierSetting.value;
        if (!this._columnSpecs.has(restoreSortColumnIdentifier))
            this._sortColumnIdentifierSetting.value = null;
        else
            this.sortColumnIdentifier = restoreSortColumnIdentifier;
    }

    layout()
    {
        this._updateVisibleRows();
        this._resizeColumnsAndFiller();
    }

    sizeDidChange()
    {
        super.sizeDidChange();

        this._previousCachedWidth = this._cachedWidth;
        this._cachedWidth = NaN;
        this._cachedHeight = NaN;
    }

    // SelectionController delegate

    selectionControllerSelectionDidChange(controller, deselectedItems, selectedItems)
    {
        for (let item of deselectedItems) {
            let rowIndex = this._indexForRepresentedObject(item);
            let row = this._cachedRows.get(rowIndex);
            if (row)
                row.classList.toggle("selected", false);
        }

        for (let item of selectedItems) {
            let rowIndex = this._indexForRepresentedObject(item);
            let row = this._cachedRows.get(rowIndex);
            if (row)
                row.classList.toggle("selected", true);
        }

        if (this._selectionController.lastSelectedItem) {
            let rowIndex = this._indexForRepresentedObject(this._selectionController.lastSelectedItem);
            this.revealRow(rowIndex);
        }

        if (this._delegate.tableSelectionDidChange)
            this._delegate.tableSelectionDidChange(this);
    }

    selectionControllerFirstSelectableItem(controller)
    {
        return this._representedObjectForIndex(0);
    }

    selectionControllerLastSelectableItem(controller)
    {
        return this._representedObjectForIndex(this.numberOfRows - 1);
    }

    selectionControllerPreviousSelectableItem(controller, item)
    {
        let index = this._indexForRepresentedObject(item);
        console.assert(index >= 0 && index < this.numberOfRows);

        return index > 0 ? this._representedObjectForIndex(index - 1) : null;
    }

    selectionControllerNextSelectableItem(controller, item)
    {
        let index = this._indexForRepresentedObject(item);
        console.assert(index >= 0 && index < this.numberOfRows);

        return index < this.numberOfRows - 1 ? this._representedObjectForIndex(index + 1) : null;
    }

    // Resizer delegate

    resizerDragStarted(resizer)
    {
        console.assert(!this._currentResizer, resizer, this._currentResizer);

        let resizerIndex = this._resizers.indexOf(resizer);

        this._currentResizer = resizer;
        this._resizeLeftColumns = this._visibleColumns.slice(0, resizerIndex + 1).reverse(); // Reversed to simplify iteration.
        this._resizeRightColumns = this._visibleColumns.slice(resizerIndex + 1);
        this._resizeOriginalColumnWidths = [].concat(this._columnWidths);
    }

    resizerDragging(resizer, positionDelta)
    {
        console.assert(resizer === this._currentResizer, resizer, this._currentResizer);
        if (resizer !== this._currentResizer)
            return;

        if (WI.resolvedLayoutDirection() === WI.LayoutDirection.RTL)
            positionDelta = -positionDelta;

        // Completely recalculate columns from the original sizes based on the new mouse position.
        this._columnWidths = [].concat(this._resizeOriginalColumnWidths);

        if (!positionDelta) {
            this._applyColumnWidths();
            return;
        }

        let delta = Math.abs(positionDelta);
        let leftDirection = positionDelta > 0;
        let rightDirection = !leftDirection;

        let columnWidths = this._columnWidths;
        let visibleColumns = this._visibleColumns;

        function growableSize(column) {
            let width = columnWidths[visibleColumns.indexOf(column)];
            if (column.maxWidth)
                return column.maxWidth - width;
            return Infinity;
        }

        function shrinkableSize(column) {
            let width = columnWidths[visibleColumns.indexOf(column)];
            if (column.minWidth)
                return width - column.minWidth;
            return width;
        }

        function canGrow(column) {
            return growableSize(column) > 0;
        }

        function canShrink(column) {
            return shrinkableSize(column) > 0;
        }

        function columnToResize(columns, isShrinking) {
            // First find a flexible column we can resize.
            for (let column of columns) {
                if (!column.flexible)
                    continue;
                if (isShrinking ? canShrink(column) : canGrow(column))
                    return column;
            }

            // Failing that see if we can resize the immediately neighbor.
            let immediateColumn = columns[0];
            if ((isShrinking && canShrink(immediateColumn)) || (!isShrinking && canGrow(immediateColumn)))
                return immediateColumn;

            // Bail. There isn't anything obvious in the table that can resize.
            return null;
        }

        while (delta > 0) {
            let leftColumn = columnToResize(this._resizeLeftColumns, leftDirection);
            let rightColumn = columnToResize(this._resizeRightColumns, rightDirection);
            if (!leftColumn || !rightColumn) {
                // No more left or right column to grow or shrink.
                break;
            }

            let incrementalDelta = Math.min(delta,
                leftDirection ? shrinkableSize(leftColumn) : shrinkableSize(rightColumn),
                leftDirection ? growableSize(rightColumn) : growableSize(leftColumn));

            let leftIndex = this._visibleColumns.indexOf(leftColumn);
            let rightIndex = this._visibleColumns.indexOf(rightColumn);

            if (leftDirection) {
                this._columnWidths[leftIndex] -= incrementalDelta;
                this._columnWidths[rightIndex] += incrementalDelta;
            } else {
                this._columnWidths[leftIndex] += incrementalDelta;
                this._columnWidths[rightIndex] -= incrementalDelta;
            }

            delta -= incrementalDelta;
        }

        // We have new column widths.
        this._widthGeneration++;

        this._applyColumnWidths();
        this._positionHeaderViews();
    }

    resizerDragEnded(resizer)
    {
        console.assert(resizer === this._currentResizer, resizer, this._currentResizer);
        if (resizer !== this._currentResizer)
            return;

        this._currentResizer = null;
        this._resizeLeftColumns = null;
        this._resizeRightColumns = null;
        this._resizeOriginalColumnWidths = null;

        this._positionResizerElements();
        this._positionHeaderViews();
    }

    // Private

    _createHeaderCell(column)
    {
        let cell = document.createElement("span");
        cell.classList.add("cell", column.identifier);
        cell.textContent = column.name;

        if (column.align)
            cell.classList.add("align-" + column.align);
        if (column.sortable) {
            cell.classList.add("sortable");
            cell.addEventListener("click", this._handleHeaderCellClicked.bind(this, column));
        }

        cell.addEventListener("contextmenu", this._handleHeaderContextMenu.bind(this, column));

        return cell;
    }

    _createFillerCell(column)
    {
        let cell = document.createElement("span");
        cell.classList.add("cell", column.identifier);
        return cell;
    }

    _createCell(column, columnIndex)
    {
        let cell = document.createElement("span");
        cell.classList.add("cell", column.identifier);
        if (column.align)
            cell.classList.add("align-" + column.align);
        if (this._columnWidths)
            cell.style.width = this._columnWidths[columnIndex] + "px";
        return cell;
    }

    _getOrCreateRow(rowIndex)
    {
        let cachedRow = this._cachedRows.get(rowIndex);
        if (cachedRow)
            return cachedRow;

        let row = document.createElement("li");
        row.__index = rowIndex;
        row.__widthGeneration = 0;
        this._styleRow(row);

        if (this._delegate.tableRowHovered) {
            this._boundHandleRowMouseEnter ??= this._handleRowMouseEnter.bind(this);
            this._boundHandleRowMouseLeave ??= this._handleRowMouseLeave.bind(this);

            row.addEventListener("mouseenter", this._boundHandleRowMouseEnter);
            row.addEventListener("mouseleave", this._boundHandleRowMouseLeave);
        }

        this._cachedRows.set(rowIndex, row);
        return row;
    }

    _styleRow(row)
    {
        let selected = row.classList.contains("selected");

        row.className = "";

        if (selected || this.isRowSelected(row.__index))
            row.classList.add("selected");

        if (this._delegate.tableRowClassNames)
            row.classList.add(...this._delegate.tableRowClassNames(this, row.__index));
    }

    _populatedCellForColumnAndRow(column, columnIndex, rowIndex)
    {
        console.assert(rowIndex !== undefined, "Tried to populate a row that did not know its index. Is this the filler row?");

        let cell = this._createCell(column, columnIndex);
        this._delegate.tablePopulateCell(this, cell, column, rowIndex);
        return cell;
    }

    _populateRow(row)
    {
        row.removeChildren();

        let rowIndex = row.__index;
        for (let i = 0; i < this._visibleColumns.length; ++i) {
            let column = this._visibleColumns[i];
            let cell = this._populatedCellForColumnAndRow(column, i, rowIndex);
            row.appendChild(cell);
        }
    }

    _resizeColumnsAndFiller()
    {
        if (isNaN(this._cachedWidth) || !this._cachedWidth)
            this._cachedWidth = this._scrollContainerElement.realOffsetWidth;

        // Not visible yet.
        if (!this._cachedWidth)
            return;

        let availableWidth = this._cachedWidth;
        let availableHeight = this._cachedHeight;

        let contentHeight = this.numberOfRows * this._rowHeight;
        this._fillerHeight = Math.max(availableHeight - contentHeight, 0);

        // No change to layout metrics so no resizing is needed.
        if (this._columnWidths && this._cachedWidth === this._previousCachedWidth) {
            this._updateFillerRowWithNewHeight();
            this._applyColumnWidthsToColumnsIfNeeded();
            return;
        }

        this._previousCachedWidth = this._cachedWidth;

        let lockedWidth = 0;
        let lockedColumnCount = 0;
        let totalMinimumWidth = 0;

        for (let column of this._visibleColumns) {
            if (column.locked) {
                lockedWidth += column.width;
                lockedColumnCount++;
                totalMinimumWidth += column.width;
            } else if (column.minWidth)
                totalMinimumWidth += column.minWidth;
        }

        let flexibleWidth = availableWidth - lockedWidth;
        let flexibleColumnCount = this._visibleColumns.length - lockedColumnCount;

        // NOTE: We will often distribute pixels evenly across flexible columns in the table.
        // If `availableWidth < totalMinimumWidth` than the table is too small for the minimum
        // sizes of all the columns and we will start crunching the table (removing pixels from
        // all flexible columns). This would be the appropriate time to introduce horizontal
        // scrolling. For now we just remove pixels evenly.
        //
        // When distributing pixels, always start from the last column to accept remainder
        // pixels so we don't always add from one side / to one column.
        function distributeRemainingPixels(remainder, shrinking) {
            // No pixels to distribute.
            if (!remainder)
                return;

            let indexToStartAddingRemainderPixels = (this._lastColumnIndexToAcceptRemainderPixel + 1) % this._visibleColumns.length;

            // Handle tables that are too small or too large. If the size constraints
            // cause the columns to be too small or large. A second pass will do the
            // expanding or crunching ignoring constraints.
            let ignoreConstraints = false;

            while (remainder > 0) {
                let initialRemainder = remainder;

                for (let i = indexToStartAddingRemainderPixels; i < this._columnWidths.length; ++i) {
                    let column = this._visibleColumns[i];
                    if (column.locked)
                        continue;

                    if (shrinking) {
                        if (ignoreConstraints || (column.minWidth && this._columnWidths[i] > column.minWidth)) {
                            this._columnWidths[i]--;
                            remainder--;
                        }
                    } else {
                        if (ignoreConstraints || (column.maxWidth && this._columnWidths[i] < column.maxWidth)) {
                            this._columnWidths[i]++;
                            remainder--;
                        } else if (!column.maxWidth) {
                            this._columnWidths[i]++;
                            remainder--;
                        }
                    }

                    if (!remainder) {
                        this._lastColumnIndexToAcceptRemainderPixel = i;
                        break;
                    }
                }

                if (remainder === initialRemainder && !indexToStartAddingRemainderPixels) {
                    // We have remaining pixels. Start crunching if we need to.
                    if (ignoreConstraints)
                        break;
                    ignoreConstraints = true;
                }

                indexToStartAddingRemainderPixels = 0;
            }

            console.assert(!remainder, "Should not have undistributed pixels.");
        }

        // Two kinds of layouts. Autosize or Resize.
        if (!this._columnWidths) {
            // Autosize: Flex all the flexes evenly and trickle out any remaining pixels.
            this._columnWidths = [];
            this._lastColumnIndexToAcceptRemainderPixel = 0;

            let bestFitWidth = 0;
            let bestFitColumnCount = 0;

            function bestFit(callback) {
                while (true) {
                    let remainingFlexibleColumnCount = flexibleColumnCount - bestFitColumnCount;
                    if (!remainingFlexibleColumnCount)
                        return;

                    // Fair size to give each flexible column.
                    let remainingFlexibleWidth = flexibleWidth - bestFitWidth;
                    let flexWidth = Math.floor(remainingFlexibleWidth / remainingFlexibleColumnCount);

                    let didPerformBestFit = false;
                    for (let i = 0; i < this._visibleColumns.length; ++i) {
                        // Already best fit this column.
                        if (this._columnWidths[i])
                            continue;

                        let column = this._visibleColumns[i];
                        console.assert(column.flexible, "Non-flexible columns should have been sized earlier", column);

                        // Attempt best fit.
                        let bestWidth = callback(column, flexWidth);
                        if (bestWidth === -1)
                            continue;

                        this._columnWidths[i] = bestWidth;
                        bestFitWidth += bestWidth;
                        bestFitColumnCount++;
                        didPerformBestFit = true;
                    }
                    if (!didPerformBestFit)
                        return;

                    // Repeat with a new flex size now that we have fewer flexible columns.
                }
            }

            // Fit the locked columns.
            for (let i = 0; i < this._visibleColumns.length; ++i) {
                let column = this._visibleColumns[i];
                if (column.locked)
                    this._columnWidths[i] = column.width;
            }

            // Best fit with the preferred initial width for flexible columns.
            bestFit.call(this, (column, width) => {
                if (!column.preferredInitialWidth || width <= column.preferredInitialWidth)
                    return -1;
                return column.preferredInitialWidth;
            });

            // Best fit max size flexible columns. May make more pixels available for other columns.
            bestFit.call(this, (column, width) => {
                if (!column.maxWidth || width <= column.maxWidth)
                    return -1;
                return column.maxWidth;
            });

            // Best fit min size flexible columns. May make less pixels available for other columns.
            bestFit.call(this, (column, width) => {
                if (!column.minWidth || width >= column.minWidth)
                    return -1;
                return column.minWidth;
            });

            // Best fit the remaining flexible columns with the fair remaining size.
            bestFit.call(this, (column, width) => width);

            // Distribute any remaining pixels evenly.
            let remainder = availableWidth - (lockedWidth + bestFitWidth);
            let shrinking = remainder < 0;
            distributeRemainingPixels.call(this, Math.abs(remainder), shrinking);
        } else {
            // Resize: Distribute pixels evenly across flex columns.
            console.assert(this._columnWidths.length === this._visibleColumns.length, "Number of columns should not change in a resize.");

            let originalTotalColumnWidth = 0;
            for (let width of this._columnWidths)
                originalTotalColumnWidth += width;

            let remainder = Math.abs(availableWidth - originalTotalColumnWidth);
            let shrinking = availableWidth < originalTotalColumnWidth;
            distributeRemainingPixels.call(this, remainder, shrinking);
        }

        // We have new column widths.
        this._widthGeneration++;

        // Apply widths.

        this._updateFillerRowWithNewHeight();
        this._applyColumnWidths();
        this._positionResizerElements();
        this._positionHeaderViews();
    }

    _updateVisibleRows()
    {
        let rowHeight = this._rowHeight;
        let updateOffsetThreshold = rowHeight * 10;
        let overflowPadding = updateOffsetThreshold * 3;

        let scrollTop = this._calculateScrollTop();
        let scrollableOffsetHeight = this._calculateOffsetHeight();

        let visibleRowCount = Math.ceil((scrollableOffsetHeight + (overflowPadding * 2)) / rowHeight);
        let currentTopMargin = this._topSpacerHeight;
        let currentBottomMargin = this._bottomSpacerHeight;
        let currentTableBottom = currentTopMargin + (visibleRowCount * rowHeight);

        let belowTopThreshold = !currentTopMargin || scrollTop > currentTopMargin + updateOffsetThreshold;
        let aboveBottomThreshold = !currentBottomMargin || scrollTop + scrollableOffsetHeight < currentTableBottom - updateOffsetThreshold;

        if (belowTopThreshold && aboveBottomThreshold && !isNaN(this._previousRevealedRowCount))
            return;

        let numberOfRows = this.numberOfRows;
        this._previousRevealedRowCount = numberOfRows;

        // Scroll back up if the number of rows was reduced such that the existing
        // scroll top value is larger than it could otherwise have been. We only
        // need to do this adjustment if there are more rows than would fit on screen,
        // because when the filler row activates it will reset our scroll.
        if (scrollTop) {
            let rowsThatCanFitOnScreen = Math.ceil(scrollableOffsetHeight / rowHeight);
            if (numberOfRows >= rowsThatCanFitOnScreen) {
                let maximumScrollTop = Math.max(0, (numberOfRows * rowHeight) - scrollableOffsetHeight);
                if (scrollTop > maximumScrollTop) {
                    this._scrollContainerElement.scrollTop = maximumScrollTop;
                    this._cachedScrollTop = maximumScrollTop;
                }
            }
        }

        let topHiddenRowCount = Math.max(0, Math.floor((scrollTop - overflowPadding) / rowHeight));
        let bottomHiddenRowCount = Math.max(0, this._previousRevealedRowCount - topHiddenRowCount - visibleRowCount);

        let marginTop = topHiddenRowCount * rowHeight;
        let marginBottom = bottomHiddenRowCount * rowHeight;

        if (this._topSpacerHeight !== marginTop) {
            this._topSpacerHeight = marginTop;
            this._topSpacerElement.style.height = marginTop + "px";
        }

        if (this._bottomDataTableMarginElement !== marginBottom) {
            this._bottomSpacerHeight = marginBottom;
            this._bottomSpacerElement.style.height = marginBottom + "px";
        }

        this._visibleRowIndexStart = topHiddenRowCount;
        this._visibleRowIndexEnd = this._visibleRowIndexStart + visibleRowCount;

        // Completely remove all rows and add new ones.
        this._listElement.removeChildren();

        // If there are an odd number of rows hidden, the first visible row must be an even row.
        this._listElement.classList.toggle("even-first-zebra-stripe", !!(topHiddenRowCount % 2));

        for (let i = this._visibleRowIndexStart; i < this._visibleRowIndexEnd && i < numberOfRows; ++i) {
            let row = this._getOrCreateRow(i);
            this._listElement.appendChild(row);
        }

        this._listElement.appendChild(this._fillerRow);
    }

    _updateFillerRowWithNewHeight()
    {
        if (!this._fillerHeight) {
            this._scrollContainerElement.classList.remove("not-scrollable");
            this._fillerRow.remove();
            return;
        }

        this._scrollContainerElement.classList.add("not-scrollable");

        // In the event that we just made the table not scrollable then the number
        // of rows can fit on screen. Reset the scroll top.
        if (this._cachedScrollTop) {
            this._scrollContainerElement.scrollTop = 0;
            this._cachedScrollTop = 0;
        }

        // Extend past edge some reasonable amount. At least 200px.
        const paddingPastTheEdge = 200;
        this._fillerHeight += paddingPastTheEdge;

        for (let cell of this._fillerRow.children)
            cell.style.height = this._fillerHeight + "px";

        if (!this._fillerRow.parentElement)
            this._listElement.appendChild(this._fillerRow);
    }

    _applyColumnWidths()
    {
        for (let i = 0; i < this._headerElement.children.length; ++i)
            this._headerElement.children[i].style.width = this._columnWidths[i] + "px";

        for (let row of this._listElement.children) {
            for (let i = 0; i < row.children.length; ++i)
                row.children[i].style.width = this._columnWidths[i] + "px";
            row.__widthGeneration = this._widthGeneration;
        }

        // Update Table Columns after cells since events may respond to this.
        for (let i = 0; i < this._visibleColumns.length; ++i)
            this._visibleColumns[i].width = this._columnWidths[i];

        // Create missing cells after we've sized.
        for (let row of this._listElement.children) {
            if (row !== this._fillerRow) {
                if (row.children.length !== this._visibleColumns.length)
                    this._populateRow(row);
            }
        }
    }

    _applyColumnWidthsToColumnsIfNeeded()
    {
        // Apply and create missing cells only if row needs a width update.
        for (let row of this._listElement.children) {
            if (row.__widthGeneration !== this._widthGeneration) {
                for (let i = 0; i < row.children.length; ++i)
                    row.children[i].style.width = this._columnWidths[i] + "px";
                if (row !== this._fillerRow) {
                    if (row.children.length !== this._visibleColumns.length)
                        this._populateRow(row);
                }
                row.__widthGeneration = this._widthGeneration;
            }
        }
    }

    _positionResizerElements()
    {
        console.assert(this._visibleColumns.length === this._columnWidths.length);

        // Create the appropriate number of resizers.
        let resizersNeededCount = this._visibleColumns.length - 1;
        if (this._resizers.length !== resizersNeededCount) {
            if (this._resizers.length < resizersNeededCount) {
                do {
                    let resizer = new WI.Resizer(WI.Resizer.RuleOrientation.Vertical, this);
                    this._resizers.push(resizer);
                    this._resizersElement.appendChild(resizer.element);
                } while (this._resizers.length < resizersNeededCount);
            } else {
                do {
                    let resizer = this._resizers.pop();
                    this._resizersElement.removeChild(resizer.element);
                } while (this._resizers.length > resizersNeededCount);
            }
        }

        // Position them.
        const columnResizerAdjustment = 3;
        let positionAttribute = WI.resolvedLayoutDirection() === WI.LayoutDirection.RTL ? "right" : "left";
        let totalWidth = 0;
        for (let i = 0; i < resizersNeededCount; ++i) {
            totalWidth += this._columnWidths[i];
            this._resizers[i].element.style[positionAttribute] = (totalWidth - columnResizerAdjustment) + "px";
        }
    }

    _positionHeaderViews()
    {
        if (!this.subviews.length)
            return;

        let offset = 0;
        let updates = [];
        for (let i = 0; i < this._visibleColumns.length; ++i) {
            let column = this._visibleColumns[i];
            let width = this._columnWidths[i];
            if (column.headerView)
                updates.push({headerView: column.headerView, offset, width});
            offset += width;
        }

        let styleProperty = WI.resolvedLayoutDirection() === WI.LayoutDirection.RTL ? "right" : "left";
        for (let {headerView, offset, width} of updates) {
            headerView.element.style.setProperty(styleProperty, offset + "px");
            headerView.element.style.width = width + "px";
            headerView.updateLayout(WI.View.LayoutReason.Resize);
        }
    }

    _isRowVisible(rowIndex)
    {
        if (!this._previousRevealedRowCount)
            return false;

        return rowIndex >= this._visibleRowIndexStart && rowIndex <= this._visibleRowIndexEnd;
    }

    _indexToInsertColumn(column)
    {
        let currentVisibleColumnIndex = 0;

        for (let columnIdentifier of this._columnOrder) {
            if (columnIdentifier === column.identifier)
                return currentVisibleColumnIndex;
            if (columnIdentifier === this._visibleColumns[currentVisibleColumnIndex].identifier) {
                currentVisibleColumnIndex++;
                if (currentVisibleColumnIndex >= this._visibleColumns.length)
                    break;
            }
        }

        return currentVisibleColumnIndex;
    }

    _handleScroll(event)
    {
        if (event.type === "mousewheel" && !event.wheelDeltaY)
            return;

        this._cachedScrollTop = NaN;
        this.needsLayout();
    }

    _handleKeyDown(event)
    {
        this._selectionController.handleKeyDown(event);
    }

    _handleMouseDown(event)
    {
        let cell = event.target.closest(".cell");
        if (!cell)
            return;

        let row = cell.parentElement;
        if (row === this._fillerRow)
            return;

        let rowIndex = row.__index;

        // Before checking if multiple selection is allowed, check if clicking the
        // row would cause it to be selected, and whether it is allowed by the delegate.
        if (!this.isRowSelected(rowIndex) && this._delegate.tableShouldSelectRow) {
            let columnIndex = Array.from(row.children).indexOf(cell);
            let column = this._visibleColumns[columnIndex];
            if (!this._delegate.tableShouldSelectRow(this, cell, column, rowIndex))
                return;
        }

        this._selectionController.handleItemMouseDown(this._representedObjectForIndex(rowIndex), event);
    }

    _handleContextMenu(event)
    {
        let cell = event.target.closest(".cell");
        if (!cell)
            return;

        let row = cell.parentElement;
        if (row === this._fillerRow)
            return;

        let columnIndex = Array.from(row.children).indexOf(cell);
        let column = this._visibleColumns[columnIndex];
        let rowIndex = row.__index;

        this._delegate.tableCellContextMenuClicked(this, cell, column, rowIndex, event);
    }

    _handleHeaderCellClicked(column, event)
    {
        let sortOrder = this._sortOrder;
        if (sortOrder === WI.Table.SortOrder.Indeterminate)
            sortOrder = WI.Table.SortOrder.Descending;
        else if (this._sortColumnIdentifier === column.identifier)
            sortOrder = sortOrder === WI.Table.SortOrder.Ascending ? WI.Table.SortOrder.Descending : WI.Table.SortOrder.Ascending;

        this.sortColumnIdentifier = column.identifier;
        this.sortOrder = sortOrder;
    }

    _handleHeaderContextMenu(column, event)
    {
        let contextMenu = WI.ContextMenu.createFromEvent(event);

        if (column.sortable) {
            if (this.sortColumnIdentifier !== column.identifier || this.sortOrder !== WI.Table.SortOrder.Ascending) {
                contextMenu.appendItem(WI.UIString("Sort Ascending"), () => {
                    this.sortColumnIdentifier = column.identifier;
                    this.sortOrder = WI.Table.SortOrder.Ascending;
                });
            }

            if (this.sortColumnIdentifier !== column.identifier || this.sortOrder !== WI.Table.SortOrder.Descending) {
                contextMenu.appendItem(WI.UIString("Sort Descending"), () => {
                    this.sortColumnIdentifier = column.identifier;
                    this.sortOrder = WI.Table.SortOrder.Descending;
                });
            }
        }

        contextMenu.appendSeparator();

        let didAppendHeaderItem = false;

        for (let [columnIdentifier, column] of this._columnSpecs) {
            if (column.locked)
                continue;
            if (!column.hideable)
                continue;

            // Add a header item before the list of toggleable columns.
            if (!didAppendHeaderItem) {
                const disabled = true;
                contextMenu.appendItem(WI.UIString("Displayed Columns"), () => {}, disabled);
                didAppendHeaderItem = true;
            }

            let checked = !column.hidden;
            contextMenu.appendCheckboxItem(column.name, () => {
                if (column.hidden)
                    this.showColumn(column);
                else
                    this.hideColumn(column);
            }, checked);
        }
    }

    _handleRowMouseEnter(event)
    {
        let row = event.target;

        this.delegate.tableRowHovered(this, row.__index);
    }

    _handleRowMouseLeave(event)
    {
        this.delegate.tableRowHovered(this, NaN);
    }

    _removeRows(representedObjects)
    {
        let removed = 0;

        let adjustRowAtIndex = (index) => {
            let row = this._cachedRows.get(index);
            if (row) {
                this._cachedRows.delete(index);
                row.__index -= removed;
                this._cachedRows.set(row.__index, row);
            }
        };

        let rowIndexes = [];
        for (let object of representedObjects)
            rowIndexes.push(this._indexForRepresentedObject(object));

        rowIndexes.sort((a, b) => a - b);

        let lastIndex = rowIndexes.lastValue;
        for (let index = rowIndexes[0]; index <= lastIndex; ++index) {
            if (rowIndexes.binaryIndexOf(index) >= 0) {
                let row = this._cachedRows.get(index);
                if (row) {
                    this._cachedRows.delete(index);
                    row.remove();
                }
                removed++;
                continue;
            }

            if (removed)
                adjustRowAtIndex(index);
        }

        if (!removed)
            return;

        for (let index = lastIndex + 1; index < this.numberOfRows; ++index)
            adjustRowAtIndex(index);


        this._selectionController.didRemoveItems(representedObjects);

        if (this._delegate.tableDidRemoveRows)
            this._delegate.tableDidRemoveRows(this, rowIndexes);
    }

    _indexForRepresentedObject(object)
    {
        return this.dataSource.tableIndexForRepresentedObject(this, object);
    }

    _representedObjectForIndex(index)
    {
        return this.dataSource.tableRepresentedObjectForIndex(this, index);
    }

    _calculateOffsetHeight()
    {
        if (isNaN(this._cachedHeight))
            this._cachedHeight = this._scrollContainerElement.realOffsetHeight;
        return this._cachedHeight;
    }

    _calculateScrollTop()
    {
        if (isNaN(this._cachedScrollTop))
            this._cachedScrollTop = this._scrollContainerElement.scrollTop;
        return this._cachedScrollTop;
    }
};

WI.Table.SortOrder = {
    Indeterminate: "table-sort-order-indeterminate",
    Ascending: "table-sort-order-ascending",
    Descending: "table-sort-order-descending",
};
