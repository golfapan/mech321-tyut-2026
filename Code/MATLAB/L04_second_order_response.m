% MECH321 — Dynamics of Engineering Systems | TYUT 2026
% Paired with the corresponding Python L04 file. Control System Toolbox is required.
% Each script writes its lecture figure to Code/Figures/MATLAB.
clear; close all; clc;
fig = figure('Color','w','Position',[100 100 900 440]);
t=linspace(0,3,1200); for zeta=[0.5 0.8], G=tf(36,[1 12*zeta 36]); y=step(G,t); plot(t,y,'LineWidth',2); hold on; end; yline(1,':'); legend('zeta = 0.5','zeta = 0.8'); xlabel('Time (s)'); ylabel('Unit-step output'); title('Damping comparison');
grid on;
out = fullfile(fileparts(fileparts(mfilename('fullpath'))),'Figures','MATLAB');
if ~exist(out,'dir'), mkdir(out); end
exportgraphics(fig,fullfile(out,'L04.png'),'Resolution',200);
disp('L04 complete');
