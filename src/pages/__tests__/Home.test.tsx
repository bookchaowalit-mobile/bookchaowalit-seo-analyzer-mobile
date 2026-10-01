// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { setupIonicReact } from '@ionic/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HISTORY_KEY } from '../../lib/history';
import Home from '../Home';

setupIonicReact();

describe('SEO analyzer Home page', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('analyzes the example, shows a score and records history without the HTML', () => {
    const { container } = render(<Home />);
    fireEvent.click(screen.getByText('Analyze'));
    expect(container.textContent).toMatch(/\d+\/100/);
    expect(container.textContent).toContain('Recent analyses');
    const stored = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].title).toBe('My page');
    expect(localStorage.getItem(HISTORY_KEY)).not.toContain('<h1>');
  });

  it('copies the report when Web Share is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, share: undefined, clipboard: { writeText } });
    const { container } = render(<Home />);
    fireEvent.click(screen.getByText('Analyze'));
    await act(async () => {
      fireEvent.click(screen.getByText('Share / copy report'));
    });
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('SEO report — My page'));
    expect(container.textContent).toContain('Report copied to the clipboard.');
  });

  it('clears history', () => {
    const { container } = render(<Home />);
    fireEvent.click(screen.getByText('Analyze'));
    fireEvent.click(screen.getByLabelText('Clear analysis history'));
    expect(container.textContent).not.toContain('Recent analyses');
    expect(localStorage.getItem(HISTORY_KEY)).toBe('[]');
  });
});
