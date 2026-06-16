# Float position for Card and Column ordering

Cards and Columns store their display order as a float (`position FLOAT`). When an item is moved between two others, its new position is the average of its neighbours' positions — no other rows need updating. We chose this over integer ordering (which requires bulk re-numbering) because drag-and-drop generates frequent reorders and we want each move to be a single-row UPDATE. If precision degrades after many insertions, a background job can renumber all positions in a column.
