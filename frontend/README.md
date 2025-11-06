# Grade Calculator System

A modern web application for calculating grades with dynamic assessment components, learning outcomes, and program outcomes.

## Features

- **Assessment Components**: Add and manage assessment components (Midterm, Final, etc.)
- **Learning Outcome Components**: Create learning outcomes with detailed descriptions
- **Program Outcome Components**: Static program outcomes for final calculations
- **Dynamic Grade Calculation**: Real-time grade calculations based on percentage connections
- **Collapsible Interface**: Clean, organized interface with collapsible sections
- **Responsive Design**: Works on desktop and mobile devices
- **Interactive Tooltips**: Hover to view detailed information

## How to Use

### 1. Adding Assessment Components
1. Click the "+" button next to "Assessment Components"
2. Enter the assessment name (e.g., "Midterm")
3. Click "Add" to create the component

### 2. Adding Grades
1. Click the "+" button in the Grade section of any assessment card
2. Enter the grade value
3. Click "Add Grade" to add it

### 3. Adding Percentages
1. Click the "+" button in the Percentages section
2. Enter how many percentages you want to add
3. Enter each percentage value
4. Click "Add Percentages"

### 4. Creating Connections
1. After adding percentages, use the connection buttons (→ Learning Outcome/Program Outcome)
2. This creates the relationship for grade calculations

### 5. Adding Learning Outcome Components
1. Click the "+" button next to "Learning Outcome Components"
2. Enter the learning outcome name
3. Enter the detail description
4. The component will appear in both left panel and right panel

## Calculation Logic

The system calculates grades using weighted averages:
- Assessment grades are connected to Learning Outcomes via percentages
- Learning Outcome grades are connected to Program Outcomes via percentages
- Final grades are calculated as weighted averages of all connections

## Technology Stack

- **Frontend**: React 18
- **Styling**: CSS3 with modern features
- **Font**: Inter font family
- **Icons**: Unicode emoji icons

## Installation

1. Clone the repository
2. Navigate to the frontend directory
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm start
   ```

## Project Structure

```
src/
├── components/
│   ├── GradeCalculator.js      # Main application component
│   ├── LeftPanel.js           # Left sidebar with component lists
│   ├── RightPanel.js          # Right panel with component cards
│   ├── ComponentSection.js    # Collapsible component sections
│   ├── ComponentCard.js       # Individual component cards
│   └── Tooltip.js            # Tooltip component for hover details
├── App.js                     # Root component
├── App.css                    # Global styles
├── index.js                   # Application entry point
└── index.css                  # Base styles
```

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## License

This project is created for educational purposes.
