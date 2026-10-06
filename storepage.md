Terminal style system monitor widgets inspired by top, htop and btop.

Every widget is drawn with plain characters in a monospace font: text meters, braille graphs, box drawing panels, process style tables and function key bars.\
Combine them to build a dashboard that looks like your favorite terminal monitor.

All widgets fit as many characters as the widget size and font size allow, so you can resize them freely.\
For the best result use a monospace font that includes box drawing, block and braille characters, such as Cascadia Mono.

Every widget has a **Theme** option: **Color** uses the htop and btop palette, **Monochrome** draws everything in one text color with reverse video headers like plain `top`.
Colors you set yourself are kept in both themes.

#### Meter

A single line text meter like the CPU and memory bars of htop and btop.
Choose the htop style `CPU[||||||| 42.1%]`, the btop style `CPU ■■■■■■■■■■ 42.1%`, the top style `CPU  42.1% [|||||||   ]` or smooth blocks.
Bars are colored by a low, warning and critical color, either as a gradient along the bar or by thresholds.
Percentages and °C temperatures run from 0 to 100. For other metrics set a min and max value, e.g. 30 to 95 for a temperature, otherwise the bar is measured against the highest value seen so far.

**Supports:** Numeric, Duration, and Currency metrics

#### Meter Grid

Many aligned meters in columns, like the per core CPU meters at the top of htop.
Add one metric per core, pick the number of columns, and label the meters with index numbers or names.

**Supports:** Numeric, Duration, and Currency metrics

#### Summary

A line of labeled values like the summary area at the top of `top`, e.g. `%Cpu(s):  5.9 us,  2.0 sy, 91.8 id`.
Stack several of them to rebuild the whole top header, with fixed value widths and bold values just like top.

**Supports:** Numeric, Duration, Currency, Text, Boolean, and date/time metrics

#### Graph

A scrolling history graph drawn with braille or block characters, like the CPU graph of btop.
Shows a header with the label and current value and fades from green at the bottom to red at the top.

**Supports:** Numeric, Duration, and Currency metrics

#### Panel

A box drawn with line characters with titles in its border, like the panels of btop.
Choose rounded, single, double, heavy or ASCII borders and place other widgets inside it.

#### Table

A list of metrics with a colored header, like the process list of htop.
Sort the rows by value, limit the number of rows, highlight a row like the htop cursor and add btop style mini bars.

**Supports:** Numeric, Duration, Currency, Text, Boolean, and date/time metrics

#### Readout

A single line of terminal text such as `Load: 42%`.
Add a prompt like `$ `, a blinking block cursor, or spread the label and value across the full width with a leader character.

**Supports:** Numeric, Duration, Currency, Text, Boolean, and date/time metrics

#### Key Bar

A row of up to 10 function keys like the `F1Help F2Setup` bar at the bottom of htop.
Rename the keys and labels freely. Every key can run an action when clicked.
