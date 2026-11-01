% Project 01 Vehicle Seat Suspension: prescribed floor input.
% Starter for Stage 1, Questions 5–7: add the velocity panel and numerical checks. Base MATLAB.
clearvars; close all; clc;
folder = fullfile(fileparts(mfilename('fullpath')), 'Plots');
if ~exist(folder, 'dir'), mkdir(folder); end
t = (0:0.0001:0.7)'; T = 0.35; alpha = 2*pi/T;
r = 0.015*(1-cos(alpha*t)).*(t<=T);
rd = 0.015*alpha*sin(alpha*t).*(t<=T);
f = figure('Visible','off','Color','w','Position',[100 100 1400 760]);
plot(t,1000*r,'Color',[0 0.4 0.7],'LineWidth',2);
grid on; xlabel('Time t (s)'); ylabel('Floor displacement r (mm)');
title('Prescribed floor input'); ylim([0 34]); xlim([0 0.7]);
hold on; plot(T/2,30,'ko','MarkerFaceColor','k');
text(T/2+0.015,30,'30 mm at 0.175 s');
xline(T,'k--');
text(T+0.015,4,'Bump ends at 0.35 s','Color','k');
set(gca,'FontSize',16,'Color','w','XColor','k','YColor','k');
set(findall(f,'Type','text'),'Color','k');
exportgraphics(f,fullfile(folder,'Project01_Input.png'),'Resolution',200);
writematrix([t r rd],fullfile(folder,'Project01_Input.csv'));
fprintf('Input peak = %.1f mm; duration = %.2f s\n',max(r)*1000,T);
