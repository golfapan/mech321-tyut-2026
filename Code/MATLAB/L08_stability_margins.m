% MECH321 — Dynamics of Engineering Systems | TYUT 2026
% Paired with the corresponding Python L08 file. Control System Toolbox is required.
% Each script writes its lecture figure to Code/Figures/MATLAB.
clear; close all; clc;
fig = figure('Color','w','Position',[100 100 900 440]);
s=tf('s'); w=logspace(-2,2,650); for K=[40 80], L=K/((s+1)*(s+2)*(s+5)); mag=squeeze(abs(freqresp(L,w))); semilogx(w,20*log10(mag),'LineWidth',2); hold on; end; yline(0,':'); legend('K=40','K=80'); xlabel('Frequency (rad/s)'); ylabel('Loop magnitude (dB)'); title('Gain crossover');
grid on;
out = fullfile(fileparts(fileparts(mfilename('fullpath'))),'Figures','MATLAB');
if ~exist(out,'dir'), mkdir(out); end
exportgraphics(fig,fullfile(out,'L08.png'),'Resolution',200);
disp('L08 complete');
