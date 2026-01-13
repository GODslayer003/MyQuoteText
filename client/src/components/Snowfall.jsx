import React, { useEffect, useState } from 'react';
import './Snowfall.css';

const Snowfall = () => {
    const [shouldShow, setShouldShow] = useState(false);

    useEffect(() => {
        const now = new Date();
        const month = now.getMonth(); // 0-11

        // Nov (10), Dec (11), Jan (0), Feb (1)
        if (month === 10 || month === 11 || month === 0 || month === 1) {
            setShouldShow(true);
        }
    }, []);

    if (!shouldShow) return null;

    // Create 25 snowflakes (reduced from 50 for a subtler effect)
    const snowflakes = Array.from({ length: 25 });

    return (
        <div className="snowfall-container" aria-hidden="true">
            {snowflakes.map((_, i) => (
                <div
                    key={i}
                    className="snowflake"
                    style={{
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 10}s`,
                        animationDuration: `${Math.random() * 5 + 7}s`,
                        opacity: Math.random() * 0.6 + 0.2,
                        fontSize: `${Math.random() * 8 + 8}px`,
                    }}
                >
                    ❄
                </div>
            ))}
        </div>
    );
};

export default Snowfall;
