% MECH321 Project 2 supplied fixed-gain simulation. Base MATLAB only.
% No controller design or solver implementation is required.
% Baseline reference speed is 8 rad/s. Stage 3, Questions 4-6 also require command = 6.
% Keep K, load timing and the voltage limit unchanged.
clear; close all; clc;
K=4; command=8; loadTorque=.4;
folder=fullfile(fileparts(mfilename('fullpath')),'Project02 outputs MATLAB');
if ~exist(folder,'dir'), mkdir(folder); end
options=odeset('RelTol',1e-9,'AbsTol',1e-11,'MaxStep',.001);
t1=(0:.001:5)'; t2=(5:.001:10)';
for clipped=0:1
    [~,qa]=ode45(@(t,q) motor_rhs(q,0,clipped,K,command),t1,[0;0],options);
    [~,qb]=ode45(@(t,q) motor_rhs(q,loadTorque,clipped,K,command),t2,qa(end,:)',options);
    t=[t1;t2(2:end)]; q=[qa;qb(2:end,:)];
    if clipped, limited=q; else, linear=q; end
end
request=K*(command-limited(:,2)); delivery=min(24,max(-24,request));
csvwrite(fullfile(folder,'motor_time.csv'),[t,limited,request,delivery,linear(:,2)]);
fprintf('Loaded speed %.6f rad/s; current %.6f A; voltage %.6f V\n',limited(end,2),limited(end,1),delivery(end));
figure(1);
subplot(3,1,1); plot(t,limited(:,2),t,linear(:,2),'--'); hold on; plot([0 10],[command command],'k--');
ylabel('Speed (rad/s)'); legend('Voltage-limited','Linear','Reference speed'); grid on;
subplot(3,1,2); plot(t,request,t,delivery); hold on; plot([0 10],[24 24],'k--');
ylabel('Voltage (V)'); legend('Request','Delivery','24 V limit'); grid on;
subplot(3,1,3); plot(t,limited(:,1)); ylabel('Current (A)'); xlabel('Time (s)'); grid on;
print(1,fullfile(folder,'time_response.png'),'-dpng','-r160');
w=logspace(-2,2,1200)'; s=1i*w;
loop=.4./(.01*s.^2+.09*s+.21);
figure(2);
subplot(2,1,1); semilogx(w,20*log10(abs(loop))); hold on; plot([.01 100],[0 0],'k--'); ylabel('Magnitude (dB)'); grid on;
subplot(2,1,2); semilogx(w,angle(loop)*180/pi); hold on; plot([.01 100],[-180 -180],'k--'); ylabel('Phase (degrees)'); xlabel('Frequency (rad/s)'); grid on;
print(2,fullfile(folder,'nominal_bode.png'),'-dpng','-r160');
% Given crossover record; the delay is a phase check, not a time simulation.
wc=4.442215;
phase=angle(.4/(.21-.01*wc^2+1i*.09*wc))*180/pi;
fprintf('Nominal PM %.6f deg; 50 ms delay PM %.6f deg\n',180+phase,180+phase-wc*.05*180/pi);

function dq=motor_rhs(q,load,clipped,K,command)
    v=K*(command-q(2));
    if clipped, v=min(24,max(-24,v)); end
    dq=[(v-2*q(1)-.1*q(2))/.5;(.1*q(1)-.1*q(2)-load)/.02];
end
